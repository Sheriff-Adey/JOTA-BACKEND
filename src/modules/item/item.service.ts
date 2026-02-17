import { Injectable, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import * as ExcelJS from 'exceljs';
import {ItemFolder} from './item-folder.entity';
import { ApiResponse } from 'src/app.interface';
import { CreateItemBankDto } from './dto/create-Itembank.dto';
import { EditItemBankDto } from './dto/edit-item-bank.dto';
import { UserService } from '../user/user.service';
import { Question } from '../question/question.entity';
import * as JSZip from 'jszip';
// import * as Docxtemplater from 'docxtemplater';
import Docxtemplater from 'docxtemplater';
import { QuestionService } from '../question/question.service';
import { Item } from './item.entity';
import { CreateItemDto, pushItemToWebDto, syncItemToWebDto } from './dto/create-item.dto';
import { ImportItemDto } from './dto/import-items.dto';
import * as fs from 'fs';
import * as  mammoth from 'mammoth';
import * as util from 'util';
import { EditItemDto } from './dto/edit-item.dto';
import { ManualAuthoringDto } from './dto/manual-authoring.dto';
import { CreateQuestionDto } from '../question/dto/create-question.dto';
import { AddMultipleItemToBankDto } from './dto/add-multiple-items.dto';
import  retry from "async-retry";
import axios from 'axios';
import * as moment from "moment";
import { User } from '../user/user.entity';

require('dotenv').config();



@Injectable()
export class ItemService {
  constructor(
    @Inject('ITEMBANKS_REPOSITORY')
    private  itemBankRepository: typeof ItemFolder,
    @Inject('ITEMS_REPOSITORY')
    private  itemRepository: typeof Item,
    private userService: UserService,
    private questionService:QuestionService
   
  ) {}
  private appInstance = process.env.APP_INSTANCE;
  private onlineServer = process.env.ONLINE_SERVER_URL;
 
  async createItemBank(createItembankDto: CreateItemBankDto): Promise<ApiResponse>{
    try{
        const existingBank = await this.findItemBankByName(createItembankDto.name)
      
        if(existingBank.data){
          return {
            status: 400,
            message: "item bank already exist",
            error: true
          }
        }
        const itemBank = await this.itemBankRepository.create<ItemFolder>({
            name: createItembankDto.name,
            description:createItembankDto.description,
            ownerId: createItembankDto.ownerId
         });
        return {
            status: 200,
            message: "item bank created successfully",
            data:{
                id: itemBank.id,
                name: createItembankDto.name,
                
            },
            error: false
        }
    }
    catch(err){
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }
 
  async editItemBank(id: string, editItembankDto: EditItemBankDto): Promise<ApiResponse>{
    try{
        const existingBank = await this.itemBankRepository.findByPk<ItemFolder>(id);
        if(!existingBank){
          return {
            status: 400,
            message: "item bank not found",
            error: true
          }
        }
        await this.itemBankRepository.update<ItemFolder>(
            {
            name: editItembankDto.name,
            description:editItembankDto.description,
            ownerId: editItembankDto.ownerId
            },
            {
            where : {id: id}
            }
         );
        return {
            status: 200,
            message: "item bank updated successfully",
            data:{
                id: id,
                name: editItembankDto.name
            },
            error: false
        }
    }
    catch(err){
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }

  async deleteItemBank(id: string): Promise<ApiResponse>{
    try{
        const existingBank = await this.itemBankRepository.findByPk<ItemFolder>(id);
        if(!existingBank){
          return {
            status: 400,
            message: "item bank not found",
            error: true
          }
        }
        await existingBank.destroy();
        return {
            status: 200,
            message: "item bank deleted successfully",
            error: false
        }
    }
    catch(err){
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }

  async getAllItemBanks(user, page: number = 1,limit: number = 10,filter?:string,searchValue?:string,sortBy?:string): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {
      let rows;
      let count;
      if(user.roles.includes("author")){
        ({ rows, count } = await this.itemBankRepository.findAndCountAll<ItemFolder>({
          where:{ownerId: user.sub},
          limit:Number(limit),
          offset,
        }));
      }
      else{
        ({ rows, count } = await this.itemBankRepository.findAndCountAll<ItemFolder>({
          limit:Number(limit),
          offset,
        }));
      }
      

      let result = [];
      if (rows.length !== 0) {
        for (const bank of rows) {
          const author = await this.userService.findUserById(bank.ownerId);
          const {rows, count} = await this.itemRepository.findAndCountAll<Item>({where:{folderId:bank.id}});
          result.push({
            id:bank.id,
            name:bank.name,
            description: bank.description,
            email: author.email,
            authorName: `${author.firstName} ${author.lastName}`,
            noOfItems: count,
            createdAt: bank.createdAt,
            updatedAt: bank.updatedAt
          });
        }
      }

      if(filter && searchValue){
        let filteredResult = await this.search(filter, searchValue, result);
        count =  filteredResult.length;
        result = filteredResult;
      }

      if(sortBy){
         result = await this.sortResults(result, sortBy)
      }
      return {
        status: 200,
        message: 'item banks retrieved successfully',
        data: result,
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
  async search(filter,searchValue, result) {
    try {
      let filteredResult = [];
      if(filter=="author"){
        filteredResult = result.filter((record) => {
           return ((record.authorName.toLowerCase().startsWith(searchValue.toLowerCase()))|| (record.authorName.toLowerCase().includes(searchValue.toLowerCase())));
        })
      }
      else if(filter=="description"){
        filteredResult = result.filter((record) => {
          return ((record.description.toLowerCase().startsWith(searchValue.toLowerCase()))||(record.description.toLowerCase().includes(searchValue.toLowerCase())));
       })
      }
      else if(filter=="name"){
        filteredResult = result.filter((record) => {
          console.log(record);
          return ((record.name.toLowerCase().startsWith(searchValue.toLowerCase()))||(record.name.toLowerCase().includes(searchValue.toLowerCase())));
       })
      }
      return filteredResult;
    } catch (err) {
       throw err;
    }
  }

  async searchItems(filter,searchValue, result) {
    try {
      let filteredResult = [];
      if(filter=="name"){
        filteredResult = result.filter((record) => {
           return ((record.questionSubject.toLowerCase().startsWith(searchValue.toLowerCase()))|| (record.questionSubject.toLowerCase().includes(searchValue.toLowerCase())));
        })
      }
      else if(filter==="topic"){
        filteredResult = result.filter((record) => {
          return ((record.questionTopic.toLowerCase().startsWith(searchValue.toLowerCase()))||(record.questionTopic.toLowerCase().includes(searchValue.toLowerCase())));
       })
      }
      else if(filter=="type"){
        filteredResult = result.filter((record) => {
          console.log(record);
          return ((String(record.questionType).toLowerCase().startsWith(searchValue.toLowerCase()))||(String(record.questionType).toLowerCase().includes(searchValue.toLowerCase())));
       })
      }
      return filteredResult;
    } catch (err) {
       throw err;
    }
  }
 

  async sortResults(results, sortBy) {
  
    if (!results || !sortBy) {
      return results;
    }

    if (sortBy === 'createdAt') {
  
      return results.sort((a, b) => moment(b[sortBy]).diff(moment(a[sortBy])));
    } else {

      return results.sort((a, b) => {

        const fieldA = String(a[sortBy]).toLowerCase();
        const fieldB = String(b[sortBy]).toLowerCase();

        return fieldA.localeCompare(fieldB);
      });
    }
  }
  
  
  async findItemBankByName(name: string): Promise<ApiResponse> {
    const itemBank = await this.itemBankRepository.findOne<ItemFolder>({ where: { name } });
    return {
        status:200,
        message:"item bank retrieved successfully",
        data:itemBank,
        error: false
    }
  }

    
  async createItem(createItemDto: CreateItemDto): Promise<Item>{
    try{
      console.log(this.appInstance);
      let isLocalAuthoring = (this.appInstance=='local')?true:false;
      console.log(isLocalAuthoring);
      let isSynced = (isLocalAuthoring)?false:true;
        return await this.itemRepository.create<Item>({
            questionType:createItemDto.questionType,
            questionSubject:createItemDto.questionSubject,
            questionTopic: createItemDto.questionTopic,
            folderId: createItemDto.itemBankId,
            difficultyLevel:createItemDto.difficultyLevel,
            authorId: createItemDto.authorId,
            isLocalAuthoring: isLocalAuthoring,
            isSynced: isSynced

         });
       
    }
    catch(err){
      throw err;
    }
  }

  async manualItemCreation(authoringDto : ManualAuthoringDto){
    try{
      console.log(process.env.APP_INSTANCE);
      console.log(this.appInstance=='local');
      console.log(this.appInstance==='local')
      let isLocalAuthoring = (this.appInstance=='local')?true:false;
      let isSynced = (isLocalAuthoring)?false:true;
      const author = await User.findByPk(authoringDto.authorId);
      // if((isLocalAuthoring == true)&& (!author)){
         
      // }
      const existingItem = await this.itemRepository.findOne<Item>({where:{
        questionSubject:authoringDto.name,
        authorId:(author)?authoringDto.authorId:null
      }});
    
  
      if(existingItem){
        return {
          status: 400,
          message:"Item with this name already exist",
          error: true
        }
      }
  
     const newItem = await this.createItem({
        questionSubject:authoringDto.name,
        difficultyLevel: (authoringDto.difficultyLevel)?authoringDto.difficultyLevel: "",
        authorId: (author)?authoringDto.authorId:null,
        questionTopic: authoringDto.topic
      })
      const questions = await Question.findAll({where:{itemId: newItem.id}})
      return {
         status: 200,
         message: "Item created succesfully",
         data:{
          ...newItem.dataValues,
          noOfQuestions:questions.length
         },
         error: false

      }
    }
    catch(err){
        return {
           status: 500,
           message: `Internal Server Error: ${err.message}`,
           error: true
        }
    }

  }


  async pushItemToWeb(user, pushDto: pushItemToWebDto) {
    try {
      if (this.appInstance !== "local") {
        return {
          status: 400,
          message: "You can only push from a local server",
          error: true,
        };
      }
  
      let itemIds = pushDto.itemIds;
      if(pushDto.itemIds.length===0){
        const items = await Item.findAll();
        itemIds = items.map((item) => item.id);
      }
      // Retrieve items and their associated questions in a single query
      let itemsWithQuestions;
       if(itemIds.length>0){
          itemsWithQuestions = await Item.findAll({
            where: { id: itemIds },
            include: [{ model: Question }],
          });
       }
       else{
        itemsWithQuestions = await Item.findAll({
          include: [{ model: Question }],
        });
       }
  
      if (!itemsWithQuestions.length) {
        return {
          status: 400,
          message: "No items found with the provided IDs",
          error: true,
        };
      }
  
      let itemData = itemsWithQuestions.map((item) => {
        let questions = item.questions.map((question) => ({
          id: question.id,
          content: question.content,
          type: question.type,
          options: question.options,
          score: question.score,
          questionTopic: question.questionTopic,
          correctOption:question.correctOption,
          difficultyLevel: question.difficultyLevel,
          embeddedMedia: question.embeddedMedia,
          translations: question.translations,
          itemId: question.itemId,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
        }));
  
        return {
          ...item.dataValues,
          questions: questions,
        };
      });
  
      console.log(itemData);
      const onlineUrl = `${this.onlineServer}/item/sync-item`;
  
      const response = await this.synchronizeData(user.token, itemData, onlineUrl);
  
      if (response.status === 200) {
        // Delete items and their associated questions after successful sync
        for(let itm of itemData){
           await Item.destroy({where:{id:itm.id}});
        }
      }
  
      return response;
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: "An error occurred",
        error: true,
      };
    }
  }
  
  async syncItems(user, syncDto: syncItemToWebDto) {
    try {
      if (this.appInstance !== "online") {
        return {
          status: 400,
          message: "You can only push to the online server",
          error: true,
        };
      }
  
      const existingItemNames = syncDto.items.map((item) => item.questionSubject);
  
      // Find existing items with the provided names
      const existingItems = await Item.findAll({
        where: { questionSubject: existingItemNames },
      });
  
      if (existingItems.length > 0) {
        const duplicateItemNames = existingItems.map((item) => item.questionSubject);
        return {
          status: 400,
          message: `Items with these names already exist: ${duplicateItemNames.join(", ")}`,
          error: true,
        };
      }
  
      const itemsToCreate = syncDto.items.map((item) => ({
        id: item.id,
        difficultyLevel: item.difficultyLevel,
        language: item.language,
        authorId: item.authorId,
        questionType: item.questionType,
        questionSubject: item.questionSubject,
        questionTopic: item.questionTopic,
        isLocalAuthoring: true,
        isSynced: true,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
  
      // Bulk insert items
      await Item.bulkCreate(itemsToCreate);
  
      const questionsToCreate = [];
  
      for (let item of syncDto.items) {
        if (item.questions.length === 0) continue;
  
        questionsToCreate.push(
          ...item.questions.map((question) => ({
            id: question.id,
            content: question.content,
            type: question.type,
            options: question.options,
            score: question.score,
            correctOption: question.correctOption,
            embeddedMedia: question.embeddedMedia,
            translations: question.translations,
            difficultyLevel: question.difficultyLevel,
            itemId: question.itemId,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          }))
        );
      }
  
      // Bulk insert questions
      await Question.bulkCreate(questionsToCreate);
  
      return {
        status: 200,
        message: "Items synced successfully",
        error: false,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 500,
        message: `An error occurred: ${e.message}`,
        error: true,
      };
    }
  }
  
   async synchronizeData(token,data, onlineApiUrl) {
    try {
      const response = await axios.post(onlineApiUrl, {items:data},{
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });
      return response.data;
    } catch (error) {
      throw error; 
    }
   }

  async  synchronizeWithRetry(token,data, onlineApiUrl) {
    try {
      const result = await retry(
        async () => {
          const jsonData = JSON.stringify(data);
          return await this.synchronizeData(token,jsonData, onlineApiUrl);
        },
        {
          retries: 3,
          onRetry: (err, attempt) => {
            console.log(`Retry attempt ${attempt}, Error: ${err.message}`);
          },
        }
      );
  
      return result;
    } catch (error) {
      throw error; // Handle retries exhausted or other exceptions
    }
  }


  async importItemFromWord(importDto: ImportItemDto): Promise<ApiResponse> {
    try {

      const existingItem = await this.itemRepository.findOne<Item>({ where: { questionSubject: importDto.subject } });
      if (existingItem) {
        return {
          status: 400,
          message: `Item with this name: ${importDto.subject} already exists`,
          error: true,
        };
      }

      const extractedText = await mammoth.extractRawText({ path: importDto.file }).then((result) => result.value);
      const parsedContent = this.parseQuestionContent(extractedText);

      // Create the new item
      const newItem = await this.createItem({
        questionSubject: importDto.subject,
        questionTopic: importDto.questionTopic,
        questionType: importDto.questionType,
        authorId: importDto.authorId,
        difficultyLevel: importDto.difficultyLevel,
        itemBankId: importDto.itemBankId,
      });
      let questions = [];
      for (const question of parsedContent) {
        console.log(question);
        if (!question.questionContent) continue;

        const questionData = question.questionContent;
        let options = question?.options;
        let correctOption = question?.correctAnswer;
        let difficultyLevel  = question.difficultyLevel;
        let score = question.score;
        let questionType = question.questionType;
        let optionList = [];
        if(options){
          options.forEach((opt) => {
            let isCorrect = opt === correctOption;
            optionList.push({
              text: opt,
              isCorrect: isCorrect,
              file: '',
            });
          });
        }

        // const createdQuestion = await this.questionService.createQuestion({
        //   content: questionData,
        //   questionType: questionType || importDto.questionType,
        //   options: optionList,
        //   itemId: newItem.id,
        //   difficultyLevel:difficultyLevel,
        //   score: score
        // }, correctOption);

         questions.push({
          score:score,
          content:questionData,
          type:questionType || importDto.questionType,
          options:optionList,
          correctOption:correctOption,
          itemId:newItem.id,
          difficultyLevel:difficultyLevel,
          questionIndex:question.questionIndex
        })

      }
      await Question.bulkCreate(questions);


      const unlinkAsync = util.promisify(fs.unlink);
      await unlinkAsync(importDto.file);

      return {
        status: 200,
        message: 'Items imported successfully',
        error: false,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: 'An error occurred',
        error: false,
      };
    }
  }

  async importItemFromNotepad(importDto: ImportItemDto): Promise<ApiResponse> {
    try {

      const existingItem = await this.itemRepository.findOne<Item>({ where: { questionSubject: importDto.subject } });
      if (existingItem) {
        return {
          status: 400,
          message: `Item with this name: ${importDto.subject} already exists`,
          error: true,
        };
      }

      const extractedText = fs.readFileSync(importDto.file, 'utf8');
      const parsedContent = this.parseQuestionContent(extractedText);

      // Create the new item
      const newItem = await this.createItem({
        questionSubject: importDto.subject,
        questionTopic: importDto.questionTopic,
        questionType: importDto.questionType,
        authorId: importDto.authorId,
        difficultyLevel: importDto.difficultyLevel,
        itemBankId: importDto.itemBankId,
      });
      let questions = [];
      for (const question of parsedContent) {
        console.log(question);
        if (!question.questionContent) continue;

        const questionData = question.questionContent;
        let options = question?.options;
        let correctOption = question?.correctAnswer;
        let difficultyLevel  = question.difficultyLevel;
        let score = question.score;
        let questionType = question.questionType;
        let optionList = [];
        if(options){
          options.forEach((opt) => {
            let isCorrect = opt === correctOption;
            optionList.push({
              text: opt,
              isCorrect: isCorrect,
              file: '',
            });
          });
        }

         questions.push({
          score:score,
          content:questionData,
          type:questionType || importDto.questionType,
          options:optionList,
          correctOption:correctOption,
          itemId:newItem.id,
          difficultyLevel:difficultyLevel,
          questionIndex:question.questionIndex
        })

      }
      await Question.bulkCreate(questions);


      const unlinkAsync = util.promisify(fs.unlink);
      await unlinkAsync(importDto.file);

      return {
        status: 200,
        message: 'Items imported successfully',
        error: false,
      };
    } catch (error) {
      console.log(error);
      return {
        status: 500,
        message: 'An error occurred',
        error: false,
      };
    }
  }



  async downloadItemCSVTemplate(){
    try{

       const workbook = new ExcelJS.Workbook();
       const worksheet = workbook.addWorksheet('items');

       worksheet.columns = [
         { header: 'Question', key: 'question', width: 10 },
         { header: 'Options', key: 'options', width: 20 },
         { header: 'CorrectOption', key: 'correctOption', width: 30 },
         { header: 'Score', key: 'score', width: 20 },
         { header: 'DifficultyLevel', key: 'difficultyLevel', width: 20 },
       ];

     return workbook;
    }
    catch(err){
      console.log(err);
    }

  }

  async downloadItemNotepadTemplate(){
    try{

       const template = `Question: What is the capital of France?
Options:
- Paris
- London
- Berlin
- Madrid
Correct Answer: Paris
Difficulty Level: easy
Score: 1

Question: The process of converting solid directly into gas is called ______.
Correct Answer: sublimation
Difficulty Level: moderate
Score: 2

Question: Which planet is known as the Red Planet?
Options:
- Earth
- Mars
- Jupiter
- Venus
Correct Answer: Mars
Difficulty Level: easy
Score: 1
`;

     return template;
    }
    catch(err){
      console.log(err);
    }

  }
  

  async importItemsFromCSV(importDto: ImportItemDto, worksheet: any){
    try{

      let isLocalAuthoring = (this.appInstance==='local')?true:false;
      let isSynced = (isLocalAuthoring)?false:true;
      const existingItem = await this.itemRepository.findOne<Item>({where:{
        questionSubject:importDto.subject,
        authorId: importDto.authorId
      }});
  
      if(existingItem){
        return {
          status: 400,
          message:"Item with this name already exist",
          error: true
        }
      }
      const newItem = await this.createItem({
        // name: name,
        questionSubject: importDto.subject,
        questionTopic: importDto.questionTopic,
        questionType: importDto.questionType,
        authorId: importDto.authorId,
        difficultyLevel: importDto.difficultyLevel,
        itemBankId: importDto.itemBankId,
      });
    
      const rows = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }
  
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const columnHeader = worksheet.getCell(1, colNumber).value;
          const cellValue = cell.value;
          rowData[columnHeader] = cellValue;
        });
        rows.push(rowData);
      });
      
      for(let item of rows){
        console.log(item);
        let options = item.Options.split(',');
        let optionList = [];
        options.forEach((opt) => {
          let isCorrect = (opt == item.CorrectOption)?true:false
           optionList.push({
            text:opt,
            isCorrect: isCorrect,
            file: ""
           })
        })
        const newQuestion =  await this.questionService.createQuestion({
          content:item.Question,
          options: optionList,
          score: item.Score,
          questionType:importDto.questionType,
          embeddedMedia:[],
          translations:"",
          itemId: newItem.id, 
          difficultyLevel: item.DifficultyLevel
        });
      }
 
  
     return {
         status: 200,
         message:`You have successfully imported ${rows.length} questions`,
         error: false
     }
    }
    catch(e){
     console.log(e);
      return {
         status:500,
         message:e.message,
         error: true
      }
    }
   }

   
  async getItemsByItemBank(user,itemBankId:string,page: number = 1,limit: number = 10,filter?:string,searchValue?:string,sortBy?:string): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {
      let rows;
      let count;
      if(user.roles.includes("author")){
       ({ rows, count } = await this.itemRepository.findAndCountAll<Item>({
          where:{folderId:itemBankId,authorId:user.sub},
          limit:Number(limit),
          offset,
        }));
      }
      else{
        ({ rows, count } = await this.itemRepository.findAndCountAll<Item>({
          where:{folderId:itemBankId},
          limit:Number(limit),
          offset,
        }));
      }

      let result = [];
      if (rows.length !== 0) {
        for (const item of rows) {

          const noOfQuestions = await this.questionService.getQuestionsCountByItemId(item.id);
          result.push({ 
            id: item.id,
            name:item.name,
            authorId:item.authorId,
            noOfQuestions: noOfQuestions.totalNoOfQuestions,
            questionType:item.questionType,
            questionSubject: item.questionSubject,
            questionTopic: item.questionTopic,
            itemBankId: item.folderId,
            difficultyLevel: item.difficultyLevel,
            language: item.language,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            difficultyLevels:{
              easy: noOfQuestions.easy,
              moderate: noOfQuestions.moderate,
              difficult: noOfQuestions.difficult
            }



          });
        }
      }
      
      if(filter && searchValue){
        let filteredResult = await this.searchItems(filter, searchValue, result);
        count =  filteredResult.length;
        result = filteredResult;
      }

      if(sortBy){
         result = await this.sortResults(result, sortBy)
      }
      return {
        status: 200,
        message: 'items retrieved successfully',
        data: result,
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

  async getItem(id: string): Promise<ApiResponse>{
    try{
        const existingItem = await this.itemRepository.findByPk<Item>(id);
        if(!existingItem){
          return {
            status: 400,
            message: "item not found",
            error: true
          }
        }
        const questions = await Question.findAll({where:{itemId: existingItem.id}})
       
        return {
            status: 200,
            message: "item retrieved successfully",
            data:{
              ...existingItem.dataValues,
              noOfQuestions: questions.length,
              questions:questions
            },
            error: false
        }
    }
    catch(err){
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }

  async getAuthoringStat(currentUser){
    try{
       let Items;
    
       if((currentUser.roles[0]=="super-admin")||((currentUser.roles[0]=="author")&&(this.appInstance=="local")))
       {
        Items = await this.itemRepository.findAll();
       }
       else{
        Items = await this.itemRepository.findAll({where:{authorId: currentUser.sub}});
       }
       let localItems = 0;
       let webItems = 0
       for(let i of Items){
          if(i.isLocalAuthoring === true){
            localItems++;
          }
          else{
            webItems++;
          }
       }
       return {
         status: 200,
         message: "Authoring statistics retrieved successfully",
         data:{
          totalItems:Items.length,
          webItems:webItems,
          localItems:localItems
         },
         error: false
       }
    }
    catch(e){
      return {
        status: 500,
        message: "An error occured "+ e.message,
        error: true
      }
    }
  }
  async editItem(id: string, editItemDto: EditItemDto): Promise<ApiResponse>{
    try{
        const existingBank = await this.itemRepository.findByPk<Item>(id);
        if(!existingBank){
          return {
            status: 400,
            message: "item not found",
            error: true
          }
        }
        await this.itemRepository.update<Item>(
            {
                questionType:editItemDto.questionType,
                questionSubject:editItemDto.questionSubject,
                questionTopic: editItemDto.questionTopic,
                folderId: editItemDto.itemBankId,
                difficultyLevel:editItemDto.difficultyLevel,
                authorId: editItemDto.authorId
            },
            {
            where : {id: id}
            }
         );
        return {
            status: 200,
            message: "item  updated successfully",
            error: false
        }
    }
    catch(err){
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }

  async deleteItem(id: string): Promise<ApiResponse>{
    try{
        const existingItem = await this.itemRepository.findByPk<Item>(id);
        if(!existingItem){
          return {
            status: 400,
            message: "item not found",
            error: true
          }
        }
        await existingItem.destroy();
        return {
            status: 200,
            message: "item bank deleted successfully",
            error: false
        }
    }
    catch(err){
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }

  async addMultipleItemToBank(addMultipleItems: AddMultipleItemToBankDto){
    try{
      // let isSynced = (addMultipleItems.isLocalAuthoring)?false:true;
      for(let i =0; i< addMultipleItems.itemIds.length; i++){
        const item = await this.itemRepository.findOne({where:{id:addMultipleItems.itemIds[i]}});
        if(!item){
          return {
             status: 400,
             message: "Invalid item id",
             error: true
          }
        }
        await this.itemRepository.update<Item>({
          folderId: addMultipleItems.itemBankId
        },
        {
          where: {
             id: addMultipleItems.itemIds[i]
          }
        })
      }

      return {
         status: 200,
         message: `The selected items have been moved`,
         error: false
      }
    }
    catch(e){
       return {
          status: 500,
          message: `Internal Server Error: ${e.message}`,
          error: true
       }
    }
  }

  async getLocallyAuthoredItems(user,page: number = 1,limit: number = 10,filter,searchValue,sortBy): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {
      let  rows;
      let count;
      let items;
      if((user.roles[0] == "super-admin")||((user.roles[0]=="author")&&(this.appInstance=="local"))){
        items = await this.itemRepository.findAndCountAll<Item>({
          where:{isLocalAuthoring:true},
          limit:Number(limit),
          offset,
        });
      }
      else{
        items = await this.itemRepository.findAndCountAll<Item>({
        where:{isLocalAuthoring:true, authorId:user.sub},
        limit:Number(limit),
        offset,
        });
      }
      rows = items.rows;
      count = items.count;

      let result = [];
      if (rows.length !== 0) {
        for (const item of rows) {

          const noOfQuestions = await this.questionService.getQuestionsCountByItemId(item.id);
          const questions = await Question.findAll({where:{itemId: item.id}});
          result.push({ 
            id: item.id,
            name:item.name,
            authorId:item.authorId,
            noOfQuestions: noOfQuestions,
            questionType:item.questionType,
            questionSubject: item.questionSubject,
            questionTopic: item.questionTopic,
            itemBankId: item.folderId,
            difficultyLevel: item.difficultyLevel,
            language: item.language,
            questions,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,



          });
        }
      }
      if(filter && searchValue){
        let filteredResult = await this.searchItems(filter, searchValue, result);
        count =  filteredResult.length;
        result = filteredResult;
      }

      if(sortBy){
         result = await this.sortResults(result, sortBy)
      }

      return {
        status: 200,
        message: 'items retrieved successfully',
        data: result,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false,
      };
    } catch (err) {
      console.log(err);
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
  }

  async getUnSyncedLocallyAuthoredItems(page: number = 1,limit: number = 10):Promise<ApiResponse>{
    const offset = (page - 1) * limit;

    try {

      const { rows, count } = await this.itemRepository.findAndCountAll<Item>({
        where:{isLocalAuthoring:true, isSynced:false},
        limit:Number(limit),
        offset,
      });

      const result = [];
      if (rows.length !== 0) {
        for (const item of rows) {

          const noOfQuestions = await this.questionService.getQuestionsCountByItemId(item.id);
          result.push({ 
            id: item.id,
            name:item.name,
            authorId:item.authorId,
            noOfQuestions: noOfQuestions,
            questionType:item.questionType,
            questionSubject: item.questionSubject,
            questionTopic: item.questionTopic,
            itemBankId: item.folderId,
            difficultyLevel: item.difficultyLevel,
            language: item.language,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,



          });
        }
      }

      return {
        status: 200,
        message: 'items retrieved successfully',
        data: result,
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

  async getSyncedLocallyAuthoredItems(page: number = 1,limit: number = 10):Promise<ApiResponse>{
    const offset = (page - 1) * limit;

    try {

      const { rows, count } = await this.itemRepository.findAndCountAll<Item>({
        where:{isLocalAuthoring:true, isSynced:true},
        limit:Number(limit),
        offset,
      });

      const result = [];
      if (rows.length !== 0) {
        for (const item of rows) {

          const noOfQuestions = await this.questionService.getQuestionsCountByItemId(item.id);
          result.push({ 
            id: item.id,
            name:item.name,
            authorId:item.authorId,
            noOfQuestions: noOfQuestions,
            questionType:item.questionType,
            questionSubject: item.questionSubject,
            questionTopic: item.questionTopic,
            itemBankId: item.folderId,
            difficultyLevel: item.difficultyLevel,
            language: item.language,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,



          });
        }
      }

      return {
        status: 200,
        message: 'items retrieved successfully',
        data: result,
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
  async getWebAuthoredItems(user,page: number = 1,limit: number = 10,filter,searchValue,sortBy): Promise<ApiResponse> {
    const offset = (page - 1) * limit;

    try {
      let rows;
      let count;
      let items;
      
      if(user.roles[0] =="super-admin"){
        items = await this.itemRepository.findAndCountAll<Item>({
          where:{isLocalAuthoring:false},
          limit:Number(limit),
          offset,
        });
      }
      else{
        items = await this.itemRepository.findAndCountAll<Item>({
          where:{isLocalAuthoring:false, authorId:user.sub},
          limit:Number(limit),
          offset,
        });
      }
      rows = items.rows;
      count = items.count;
      let result = [];
      if (rows.length !== 0) {
        for (const item of rows) {

          const noOfQuestions = await this.questionService.getQuestionsCountByItemId(item.id);
          const questions = await Question.findAll({where:{itemId: item.id}});
          result.push({ 
            id: item.id,
            name:item.name,
            authorId:item.authorId,
            noOfQuestions: noOfQuestions,
            questionType:item.questionType,
            questionSubject: item.questionSubject,
            questionTopic: item.questionTopic,
            itemBankId: item.folderId,
            difficultyLevel: item.difficultyLevel,
            language: item.language,
            questions,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,



          });
        }
      }

      if(filter && searchValue){
        let filteredResult = await this.searchItems(filter, searchValue, result);
        count =  filteredResult.length;
        result = filteredResult;
      }

      if(sortBy){
         result = await this.sortResults(result, sortBy)
      }
      return {
        status: 200,
        message: 'items retrieved successfully',
        data: result,
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
 
  private parseQuestionContent(content: string) {
    const parsedQuestions = [];
    // const questionSegments = content.toLowerCase().split('question:');
    const questionSegments = content.split(/question:/i);
    let questionIndex = 1; 
    for (const segment of questionSegments) {
      if (segment.trim() === '') continue;
  
      const lines = segment.trim().split('\n');
  
      const questionContent = lines[0].trim();
      const optionsStartIndex = lines.findIndex(line => line.toLowerCase().includes('options:'));
      const correctAnswerLineIndex = lines.findIndex(line => line.toLowerCase().includes('correct answer:'));
      const difficultyLevelIndex = lines.findIndex(line => line.toLowerCase().includes('difficulty level:'));
      const scoreIndex = lines.findIndex(line => line.toLowerCase().includes('score:'));
      if (optionsStartIndex === -1) {
 
        if(difficultyLevelIndex===-1 || scoreIndex===-1) continue;
        const difficultyLevel  = lines[difficultyLevelIndex].split(':')[1].trim();
        const score = lines[scoreIndex].split(':')[1].trim();
       
          if (questionContent.toLowerCase().includes('______')) {
            //const correctAnswer = lines[correctAnswerLineIndex].split(':',1)[1].trim();
            const colonIndex = lines[correctAnswerLineIndex].indexOf(':');
            const correctAnswer = lines[correctAnswerLineIndex].substring(colonIndex+1).trim();
            console.log("question", questionContent);
                parsedQuestions.push({
                  questionIndex:questionIndex++,
                  questionContent,
                  questionType: 'FillInTheGap',
                  difficultyLevel,
                  score,
                  correctAnswer
                });
         }
         else{
           parsedQuestions.push({
                    questionIndex:questionIndex++,
                    questionContent,
                    questionType: 'Essay',
                    difficultyLevel,
                    score,
                  });
         }
        continue;
      }
  
      const options = [];
      for (let i = optionsStartIndex + 1; i < correctAnswerLineIndex; i++) {
        // Skip empty lines and remove any leading hyphens or whitespace
        const option = lines[i].trim().replace(/^-/, '').trim();
        if (option) {
          options.push(option);
        }
      }
  
      // const correctAnswer = lines[correctAnswerLineIndex].split(':',2)[1].trim();
      const colonIndex = lines[correctAnswerLineIndex].indexOf(':');
      const correctAnswer = lines[correctAnswerLineIndex].substring(colonIndex+1).trim();
      console.log("answer", correctAnswer)
      const difficultyLevel  = lines[difficultyLevelIndex].split(':')[1].trim();
      const score = lines[scoreIndex].split(':')[1].trim();
      
      parsedQuestions.push({
        questionIndex:questionIndex++,
        questionContent,
        options,
        correctAnswer,
        difficultyLevel,
        score
      });
    }
  
    parsedQuestions.sort((a, b) => a.questionIndex - b.questionIndex);
    
    return parsedQuestions;
  }
  




  generateRandomID(len: number) {
    let id = '';
    const chars = 'ABCDEFGHKMNPQRSTUVWXYZ23456789';

    for (let i = 0; i < len; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id
  }
  
}


