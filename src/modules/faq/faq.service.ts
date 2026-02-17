import { Injectable, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import {Role } from '../role/role.entity';
import { ApiResponse } from 'src/app.interface';
import { InjectModel } from '@nestjs/sequelize';
import { Faq } from './faq.entity';
import { CreateFaqDto } from './dto/create-faq.dto';

@Injectable()
export class FaqService {
  constructor(
  ) {}
  
  async createFaq(faqDto: CreateFaqDto): Promise<ApiResponse>{
    try{
        const existingRole = await this.findFaqByName(faqDto.title);
        if(existingRole.data){
          return {
            status: 400,
            message: "faq already exist",
            error: true
          }
        }
        const faq = await Faq.create<Faq>({
          title:faqDto.title,
          description: faqDto.description,
          image:faqDto.image||""
        });
        
      
        return {
            status: 200,
            message: "faq created successfully",
            data:{
                id: faq.id,
                title:faq.title,
                description:faq.description
            },
            error: false
        }
    }
    catch(err){
      console.log(err);
      return {
        status:500,
        message: err.message,
        error: true
      }
    }
  }
 
  async findFaqByName(name: string): Promise<ApiResponse> {
    const faq = await Faq.findOne<Faq>({
      where: { title:name },
    });
    return {
        status:200,
        message:"faq retrieved successfully",
        data:faq,
        error: false
    }
  }

  async findFaqById(id: string): Promise<ApiResponse> {
    const faq = await Faq.findByPk(id);
    return {
        status:200,
        message:"faq retrieved successfully",
        data:faq,
        error: false
    }
  }

  async getAllFaqs(searchvalue?:string): Promise<ApiResponse> {
  
    try {
      let faqs = await Faq.findAll({});
      if(searchvalue){
        faqs = faqs.filter((faq) => {
            return ((faq.title.toLowerCase().includes(searchvalue.toLowerCase()))|| (faq.description.toLowerCase().includes(searchvalue.toLowerCase())))
        })
      }
  
      return {
        status: 200,
        message: 'faqs retrieved successfully',
        data: faqs,
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
  
 
  async editFaq(id: string, editDto: CreateFaqDto): Promise<ApiResponse>{
    try{
        const existingfaq = await Faq.findByPk<Faq>(id);
        if(!existingfaq){
          return {
            status: 400,
            message: "role not found",
            error: true
          }
        }
        await Faq.update<Faq>(
            {
            title: editDto.title,
            description:editDto.description,
            image: editDto?.image || ""
            },
            {
            where : {id: id}
            }
         );

        return {
            status: 200,
            message: "faq updated successfully",
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

  async deleteFaq(id: string){
    try{
      const faq = await Faq.findOne<Faq>({where:{id:id}})
      if(!faq){
         return {
           status: 400,
           message:"No Faq found with the specified id",
           error: true
         }
      }
      await faq.destroy();
      return{
        status: 200,
        message:"faq deleted successfully",
        error: false
      }
    }
    catch(e){
      return {
        status: 500,
        message:`Internal Server Error: ${e.message}`,
        error: true
      }
    }
  }


}


