import { Injectable, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import {Role } from '../role/role.entity';
import { ApiResponse } from 'src/app.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Question } from './question.entity';
import { CreateQuestionDto, DifficultyLevel, QuestionType } from './dto/create-question.dto';
import { Item } from '../item/item.entity';

@Injectable()
export class QuestionService {
  constructor(
    @Inject('QUESTIONS_REPOSITORY')
    private  questionRepository: typeof Question,
    @Inject('ITEMS_REPOSITORY')
    private itemRepository: typeof Item 
  ) {}
  
  async createQuestion(createQuestionDto : CreateQuestionDto, correctAnswer?: string){
    let correctOption;
    if( createQuestionDto.options && createQuestionDto.options.length > 0){
      correctOption = createQuestionDto.options.find((op) => {
        return op.isCorrect == true;
      });
    }
   
    return await this.questionRepository.create<Question>({
        score: createQuestionDto?.score,
        content: createQuestionDto.content,
        type: createQuestionDto.questionType,
        options:createQuestionDto?.options || [],
        correctOption:(correctAnswer)?correctAnswer:(correctOption?.text || ""),
        translations:createQuestionDto.translations,
        itemId: createQuestionDto.itemId,
        embeddedMedia:createQuestionDto.embeddedMedia,
        difficultyLevel: createQuestionDto.difficultyLevel
        
    })
  }


  async getQuestionsByItem(itemId:string,page: number = 1,limit: number = 10): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {

      const { rows, count } = await this.questionRepository.findAndCountAll<Question>({
        where:{itemId:itemId},
        limit:Number(limit),
        offset,
        order: [['questionIndex', 'ASC']]  
      });


      return {
        status: 200,
        message: 'questions retrieved successfully',
        data: rows,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  
  async getQuestionsByItemNonPaginated(itemId:string): Promise<ApiResponse> {
   
    try {

      const questions= await this.questionRepository.findAll<Question>({
        where:{itemId:itemId},
        order: [['questionIndex', 'ASC']]  
      });


      return {
        status: 200,
        message: 'questions retrieved successfully',
        data: questions,
        error: false,
      };
    } catch (err) {
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }
  async getQuestionsCountByItemId(itemId:string)  {
    try {

      const { rows, count } = await this.questionRepository.findAndCountAll<Question>({
        where:{itemId:itemId},
      });
     
      let easyCount =  await this.questionRepository.count<Question>({
        where:{itemId:itemId, difficultyLevel: DifficultyLevel.Easy},
      });
      let difficultCount =  await this.questionRepository.count<Question>({
        where:{itemId:itemId, difficultyLevel: DifficultyLevel.Difficult},
      });
      let moderateCount =  await this.questionRepository.count<Question>({
        where:{itemId:itemId, difficultyLevel: DifficultyLevel.Moderate},
      });

      return {
         totalNoOfQuestions: count,
         easy: easyCount,
         difficult:difficultCount,
         moderate: moderateCount
      } 
    } catch (err) {
      
       throw err;
    }
  }
  

  async createQuestionsManually(createQuestionDto: CreateQuestionDto){
    try{
       const item = await this.itemRepository.findByPk(createQuestionDto.itemId);
       if(!item){
         return {
           status: 400,
           message: "question must be created on a valid item",
           error: true
         }
       }
       
      const newQuestion =  await this.createQuestion({
         content:createQuestionDto.content,
         options: createQuestionDto?.options,
         score: createQuestionDto?.score,
         questionType:createQuestionDto.questionType,
         embeddedMedia: createQuestionDto.embeddedMedia,
         translations:createQuestionDto.translations,
         difficultyLevel: createQuestionDto.difficultyLevel,
         itemId: createQuestionDto.itemId
       });
       console.log(createQuestionDto.questionType);
       await this.itemRepository.update<Item>({
        questionType: createQuestionDto.questionType
       },
       {
        where : {id: createQuestionDto.itemId}
        }
       )
       
       return {
         status: 200,
         message: "Question created successfully",
         data: {
          id: newQuestion.id
         },
         error: false
       }
       
    }
    catch(e){
      console.log(e);
       return {
         status:500,
         message: `Internal Server Error: ${e.message}`,
         error: true
       }
    }
  }

  async editQuestions(id:string, createQuestionDto: CreateQuestionDto){
    try{

      const question = await Question.findByPk(id);
      if(!question){
        return {
          status: 400,
          message: "invalid question id",
          error: true
        }
      }
       const item = await this.itemRepository.findByPk(createQuestionDto.itemId);
       if(!item){
         return {
           status: 400,
           message: "invalid item id",
           error: true
         }
       }
       let correctOption;
       if( createQuestionDto.options && createQuestionDto.options.length > 0){
        correctOption = createQuestionDto.options.find((op) => {
          return op.isCorrect == true;
        });
      }
       
       await Question.update({
        content:createQuestionDto.content,
        options: createQuestionDto?.options,
        score: createQuestionDto?.score,
        type:createQuestionDto.questionType,
        embeddedMedia: createQuestionDto.embeddedMedia,
        correctOption:correctOption?.text || "",
        translations:createQuestionDto.translations,
        itemId: createQuestionDto.itemId
      },{where:{id:id}});
       await this.itemRepository.update<Item>({
        questionType: createQuestionDto.questionType
       },
       {
        where : {id: createQuestionDto.itemId}
        }
       )
       
       return {
         status: 200,
         message: "Question edited successfully",
         error: false
       }
       
    }
    catch(e){
       return {
         status:500,
         message: `Internal Server Error: ${e.message}`,
         error: true
       }
    }
  }


  async deleteQuestions(id:string){
    try{

      const question = await Question.findByPk(id);
      if(!question){
        return {
          status: 400,
          message: "invalid question id",
          error: true
        }
      }
       
      await question.destroy();
       
       return {
         status: 200,
         message: "Question deleted successfully",
         error: false
       }
       
    }
    catch(e){
       return {
         status:500,
         message: `Internal Server Error: ${e.message}`,
         error: true
       }
    }
  }

  async getQuestions(id:string){
    try{

      const question = await Question.findByPk(id);
      if(!question){
        return {
          status: 400,
          message: "invalid question id",
          error: true
        }
      }
       
       return {
         status: 200,
         message: "Question edited successfully",
         data:question,
         error: false
       }
       
    }
    catch(e){
       return {
         status:500,
         message: `Internal Server Error: ${e.message}`,
         error: true
       }
    }
  }
  
 
}


