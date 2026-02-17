import { Injectable, Inject } from '@nestjs/common';
import { User } from './user.entity';
import { hash, compare } from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/shared/notifications/email.service';
import { ApiResponse } from 'src/app.interface';
import { activateNotificationTemplate, createPasswordTemplate, forgotPassNotificationTemplate} from '../notification/notification.template';
import * as config from 'config';
import {Role } from '../role/role.entity';
import { RoleService } from '../role/role.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, SetPasswordDto } from './dto/login.dto';
import { jwtConstants } from '../auth/constants';
import { ForgotPassDto } from './dto/forgot-pass.dto';
import { Token } from './token.entity';
import { ChangePasswordDto, ResetPassDto } from './dto/reset-pass.dto';
import { CreateAdminDto, EditAdminDto } from './dto/create-admin.dto';
import { NotificationService } from '../notification/notification.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { itemBankProviders } from '../item/item-bank.providers';
import { ItemFolder } from '../item/item-folder.entity';
import { Item } from '../item/item.entity';
import { Exam } from '../exam/exam.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuditLog } from '../audit/audit-log.entity';
import { RolePermission } from '../role/role-permission.entity';
import { Permission } from '../role/permission.entity';
import { authenticator } from 'otplib';
import { Setting } from '../settings/setting.entity';

require('dotenv').config();

@Injectable()
export class UserService {
  private appUrl = `${process.env.APP_URL}`;
  private frontendUrl = `${process.env.FRONTEND_URL}`;
  private authoringUrl = `${process.env.AUTHORING_URL}`;
  private localAdminUrl = `${process.env.LOCALADMIN_URL}`;
  private readonly secret: string;
  private static otps = new Map<string, any>();
  private jwtSecret =  config.get("jwtSecret");
  constructor(
    @Inject('USERS_REPOSITORY')
    private  userRepository: typeof User,
    @Inject('TOKENS_REPOSITORY')
    private  tokenRepository: typeof Token,
    private roleService: RoleService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    this.secret = authenticator.generateSecret();

  }
  
  async createUser(createUserDto: CreateUserDto): Promise<ApiResponse> {
   try{
      const { email, password } = createUserDto;

      const existingEmail = await this.userRepository.findOne<User>({ where: { email } })
     
      if(existingEmail){
        return {
          status: 400,
          message:"Email already exist",
          error: true
        }
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(createUserDto.password)) {
        return {
          status: 400,
          message: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character',
          error: true
        };
      }

      const hashedPassword = await hash(password, 10);
      const token = this.generateVerificationToken()
      const link = `${this.appUrl}/account/verify-email?token=${token}`
      const template = await activateNotificationTemplate({
       link,
      });
      const formattedTemplate = template
      .replace('{name}', '')
      .replace('{link}', link);
      //const body = `Hello, please verify your email by clicking this link: ${link}`;
      const body =formattedTemplate;
      // await this.emailService.sendEmailSendgrid(
      //   html,
      //   email,
      //   'Email Activation',
      // );
      await this.emailService.sendEmail(
        email,
        'Email Activation',
        body,
        true
      );

      const role = await this.roleService.findRoleByName("super-admin")
      console.log(role);
      const roleId = role.data.id;
                     
      await this.userRepository.create({ 
        email,
        password: hashedPassword, 
        activationToken:token,
         roleId: roleId,
        });

      return {
          status: 200,
          message: "Account Created Successfully",
          error: false
      }
   
    }
   catch(err){
     console.log(err);
     return {
       status: 500,
       message: err.message,
       error: true
     }
   }

  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne<User>({ where: { email } })
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findByPk<User>(id);
  }

  async forgotPassword(forgotPasswordDto: ForgotPassDto): Promise<ApiResponse> {
    try {
      const user = await this.findUserByEmail(forgotPasswordDto.email);
   
      // if user does not exist
      if (!user) {
        return {
          status: 400,
          message: 'Invalid Email',
          error:true
        };
      }
 
      const token = this.generateVerificationToken();
      await this.tokenRepository.create<Token>({token:token, ownerId:user.id})
      const role = await Role.findByPk(user.roleId)
      console.log(role);
      let baseUrl =
          (role.name === 'admin'||role.name === 'super-admin')
            ? `${this.frontendUrl}`
            : role.name === 'author'
            ? `${this.authoringUrl}`
            : role.name === 'local-admin'
            ? `${this.localAdminUrl}`
            : `${this.frontendUrl}`;

      const html = await forgotPassNotificationTemplate(
       forgotPasswordDto.email,
      `${baseUrl}/auth/reset-password?token=${token}`,
      );
      // await this.emailService.sendEmailSendgrid(
      //   html,
      //   user.email,
      //   'Password Reset',
      // );
      await this.emailService.sendEmail(
        (user.firstName||user.email),
        'Password Reset',
        html,
        true
      );
      
      return {
        status: 200,
        message: 'If an account with this email exists, you will receive a password reset link shortly',
        error:false
      };
    } catch (e) {
      return {
        status:500,
        message:`Internal Server Error: ${e.message}`,
        error:true
      }
    }
  }


  async resetPassword(resetPasswordDto: ResetPassDto): Promise<ApiResponse> {
    try {
      const tokenFound = await this.tokenRepository.findOne<Token>({where: {token: resetPasswordDto.token}})
   
      if(!tokenFound){
        return{
          status:400,
          message:"invalid token",
          error:true
        }
      }
     
      if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
        return {
          status: 400,
          message: 'Passwords do not match',
          error:true
        };
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(resetPasswordDto.password)) {
        return {
          status: 400,
          message: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character',
          error:true
        };
      }

      const tokenOwner = await this.userRepository.findByPk(tokenFound.ownerId)
      const newHashedPassword = await hash(resetPasswordDto.password,10);
      await this.userRepository.update<User>(
        {
         password:newHashedPassword,
        },{
        where: {
          id:tokenOwner.id
        }   
       });
     
     
      await tokenFound.destroy()
      await AuditLog.create({
        action: "Reset Password",
        userId:tokenOwner.id
      });
      return {
        status: 200,
        message: 'Password Reset Successful',
        error:false
      };
    } catch (e) {
      return {
        status: 500,
        message: e.message,
        error:false
      }
    }
  }

  async verifyEmailToken(token: string):Promise<ApiResponse> {
    try{
       const tokenOwner = await this.userRepository.findOne<User>({where:{activationToken:token}});
       if(!tokenOwner){
         return{
           status:400,
           message:"invalid or expired link",
           error:true
         }
       }
       await this.userRepository.update<User>(
        {
        activationToken:null,
        isActive:true
        },{
        where: {
          id:tokenOwner.id
        }   
       });
        
       await this.notificationService.createNotification({
        subject: "Account Activation",
        message:`account: ${tokenOwner.email} has been activated`,
        isScheduled:false,
        userId:tokenOwner.id,
        sentOn:new Date().toISOString()
      })
       return {
         status:200,
         message:"Email Verification Successful,Proceed to login",
          error:false
       }
    }
    catch(e){
      return {
        status:500,
        message:e.message,
        error:true
      }
    }
   }
   async getAllUsers(page: number = 1, limit: number = 10): Promise<ApiResponse> {
    try {
      const offset = (page - 1) * limit;
  
      const { rows, count } = await this.userRepository.findAndCountAll<User>({
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']], 
      });
  
      const users = await Promise.all(
        rows.map(async (user) => {
          const role = await Role.findByPk(user.roleId);
          return {
            ...user.dataValues,
            assignedRole: role.name,
          };
        })
      );
  
      return {
        status: 200,
        message: 'List of users retrieved successfully',
        data: users,
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
        message: `Internal Server Error: ${err.message}`,
        error: true,
      };
    }
  }
  
   
   async getAuditByUserId( userId:string, page: number = 1,limit: number = 10):Promise<ApiResponse>{
    try{
       const user = await User.findByPk(userId);
       if(!user){
         return {
           status:400,
           message:"user not found",
           error: true
         }
       }
       const offset = (page - 1) * limit;

        const { rows, count }= await AuditLog.findAndCountAll({
          where:{userId: userId},
          limit:Number(limit),
          offset,
        });
      
       return {
        status: 200,
        message: "Audit logs retrieved successfully",
        data: rows,
        pageInfo: {
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
        error: false
       }
    }
    catch(err){
       return {
          status:500,
          message: `Internal Server Error: ${err.message}`,
          error:true
       }
    }
   }
   async login(loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const { email, password } = loginDto;

      const user = await this.userRepository.findOne<User>({ 
        where: { email }, 
        include: [{ model: Role }]
      });

    
      if (!user || !(await compare(password, user.password))) {
        return {
          status: 400,
          message: 'Invalid credentials',
          error: true,
        };
      }
      if((user.role.name === "author")){
         return {
           status:400,
           message:"unauthorized",
           error:true
         }
      }
      if(!user.isActive){
        return {
          status: 400,
          message: 'Your account has not been activated',
          error: true,
        };
      }

      // const settings = await Setting.findAll();
      // let twoFactorSettings = settings[0].twoFactorSettings;
      // if(twoFactorSettings){
      //   let newOtp = this.generateOtpCode();
      //   console.log(newOtp);
      //   UserService.otps.set(newOtp, user.id);
      //   // console.log(UserService.otps);
      //   if(twoFactorSettings.emailAuth){
      //     const html = `Your OTP code is: ${newOtp}`
      //     await this.emailService.sendEmailSendgrid(
      //       html,
      //       email,
      //       'Two-Factor Authentication',
      //     );
      //     }
         
      //     return {
      //        status:200,
      //        message: `An OTP code has been sent to ${email}`,
      //        error: false
      //     }
       
      //  }
       
      
      let rolePermissions = await RolePermission.findAll({where:{roleId:user.role.id}});
      let userPermissions = [];
      for(let p of rolePermissions){
        let priviledge = await Permission.findOne({where:{id:p.permissionId}});
        userPermissions.push(priviledge.name);
      }
      
      const accessToken = this.generateJwtToken(user,userPermissions);
      const refreshToken = this.generateRefreshToken(user,userPermissions);
      return {
        status: 200,
        message: 'Login successful',
        data: { 
          userId: user.id,
          email: email,
          role:user.role.dataValues.name,
          isActive: true,
          accessToken:accessToken,
          refreshToken: refreshToken,
          priviledges:userPermissions
        },
        error: false
      };
    } catch (err) {
   
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
   }


   async verifyLoginOTP(otpCode: string){
      try{
         const otpOwner = UserService.otps.get(otpCode);
         console.log(UserService.otps);
      
         console.log(otpOwner)
         if(!otpOwner){
            return {
               status:400,
               message:"invalid OTP code",
               error: true
            }
         }
         const isValid = this.verifyOtpCode(otpCode);
         console.log(isValid);
         if(!isValid){
           return {
             status: 400,
             message: "Invalid OTP code",
             error: true
           }
         }
    
         const user = await this.userRepository.findOne<User>({ 
          where: { id:otpOwner }, 
          include: [{ model: Role }]
        });
           
        let rolePermissions = await RolePermission.findAll({where:{roleId:user.role.id}});
        let userPermissions = [];
        for(let p of rolePermissions){
          let priviledge = await Permission.findOne({where:{id:p.permissionId}});
          userPermissions.push(priviledge.name);
        }
        
        const accessToken = this.generateJwtToken(user,userPermissions);
        const refreshToken = this.generateRefreshToken(user,userPermissions);
        return {
          status: 200,
          message: 'Login successful',
          data: { 
            userId: user.id,
            email: user.email,
            role:user.role.dataValues.name,
            isActive: true,
            accessToken:accessToken,
            refreshToken: refreshToken,
            priviledges:userPermissions
          },
          error: false
        };
      }
      catch(e){
         return {
           status:500,
           message:"An error occurred",
           error: true
         }
      }
   }

   
   generateOtpCode(): string {
    // Generate the OTP code
    const otpCode = authenticator.generate(this.secret);
    return otpCode;
   }

  verifyOtpCode(userCode: string): boolean {
    // Verify the OTP code entered by the user
    return authenticator.verify({ token: userCode, secret: this.secret });
  }

   async authorLogin(loginDto: LoginDto): Promise<ApiResponse> {
    try {
      const { email, password } = loginDto;

      const user = await this.userRepository.findOne<User>({ 
        where: { email }, 
        include: [{ model: Role }]
      });

    
      if (!user || !(await compare(password, user.password))) {
        return {
          status: 400,
          message: 'Invalid credentials',
          error: true,
        };
      }

      if(!user.isActive){
        return {
          status: 400,
          message: 'Your account has not been activated',
          error: true,
        };
      }

      if((user.role.dataValues.name !== 'author') && (user.role.dataValues.name !== 'super-admin')){
        return {
          status: 403,
          message: 'Forbidden Access!',
          error: true,
        };
      }
      let rolePermissions = await RolePermission.findAll({where:{roleId:user.role.id}});

      let userPermissions = [];
      for(let p of rolePermissions){
        let priviledge = await Permission.findOne({where:{id:p.permissionId}});
        userPermissions.push(priviledge.name);
      }
      console.log(userPermissions);
      const accessToken = this.generateJwtToken(user,userPermissions);
      const refreshToken = this.generateRefreshToken(user,userPermissions);
      return {
        status: 200,
        message: 'Login successful',
        data: { 
          userId: user.id,
          email: email,
          role:user.role.dataValues.name,
          isActive: true,
          accessToken:accessToken,
          refreshToken: refreshToken,
          privildeges:userPermissions
        },
        error: false
      };
    } catch (err) {
   
      return {
        status: 500,
        message: err.message,
        error: true,
      };
    }
   }

   
   async logOut(token:string): Promise<ApiResponse>{
     let blackList = await this.cacheManager.get<any[]>("tokenBlackList");
     if(!blackList){
       blackList = [token];
       await this.cacheManager.set('tokenBlackList',blackList,0);
     }
     blackList = [...blackList,token];
     await this.cacheManager.set('tokenBlackList',blackList,0);
     return {
       status: 200,
       message: "Logout successful",
       error: false
     }
   }

  async refreshTokens(refreshToken: string): Promise<ApiResponse> {

    try{
      const decodedToken = this.jwtService.verify(refreshToken, {
        secret: `${this.jwtSecret}`,
      });
    
      const user = await this.findUserByEmail(decodedToken.email);
      if (!user) {
        return { 
          status:400,
          message:"Invalid refresh token",
          error:true
        }
        }
        let rolePermissions = await RolePermission.findAll({where:{roleId:user.role.id}});
        let userPermissions = [];
        for(let p of rolePermissions){
          let priviledge = await Permission.findOne({where:{id:p.permissionId}});
          userPermissions.push(priviledge.name);
        }
        console.log(userPermissions);
        const accessToken = this.generateJwtToken(user,userPermissions);
        const refToken = this.generateRefreshToken(user,userPermissions);
      return { 
          status:200,
          message:"Token refreshed successfully",
          data:{ accessToken, refreshToken: refToken},
          error:false
      }
    }
    catch(e){
      return {
        status: 500,
        message:e.message,
        error: true
      }
    }
  }


  private generateJwtToken(user: User,userPermissions:any[]): string {
    const payload = { sub: user.id, email: user.email, roles:[user.role.dataValues.name],permissions:userPermissions };
    return this.jwtService.sign(payload,{ secret: `${this.jwtSecret}`,expiresIn: '24h'} );
  }
  
  private generateRefreshToken(user: User,userPermissions:any[]): string {
    const payload = { sub: user.id, email: user.email,permissions:userPermissions };
    return this.jwtService.sign(payload, {
      secret: `${this.jwtSecret}`,
      expiresIn: '7d', 
    });
  }

  private generateVerificationToken(){
    const token = randomBytes(8).toString('hex');
    return token;
  }

  async createAdmin(createAdminDto: CreateAdminDto): Promise<ApiResponse> {
    try{
       const { email, firstName,lastName, RoleId} = createAdminDto;
 
       const existingEmail = await this.userRepository.findOne<User>({ where: { email } })
      
       if(existingEmail){
         return {
           status: 400,
           message:"Email already exist",
           error: true
         }
       }
      
       const role = await Role.findByPk(RoleId);
       if(!role){
         return {
           status: 400,
           message:"Invalid role id",
           error: true
         }
       }
                      
       const newUser = await this.userRepository.create({ 
         email,
         firstName,
         lastName,
         password: '', 
         roleId: RoleId,
         });
 
        const token = this.generateVerificationToken();
        await this.tokenRepository.create<Token>({token:token, ownerId:newUser.id})
        
         let baseUrl =
          role.name === 'admin'
            ? `${this.frontendUrl}`
            : role.name === 'author'
            ? `${this.authoringUrl}`
            : role.name === 'local-admin'
            ? `${this.localAdminUrl}`
            : `${this.frontendUrl}`;

        const link = `${baseUrl}/auth/create-password?token=${token}`;
        const html = await createPasswordTemplate({
          name: email,
          link: link,
        });
        // await this.emailService.sendEmailSendgrid(
        //   html,
        //   email,
        //   'Account Creation',
        // );
        await this.emailService.sendEmail(
          email,
          'Account Creation',
          html,
          true
        );
       return {
           status: 200,
           message: "Account Created Successfully",
           error: false
       }
    
     }
    catch(err){
      console.log(err);
      return {
        status: 500,
        message: err.message,
        error: true
      }
    }
 
   }

  async createAdminPassword(createPassDto: SetPasswordDto){
   try{
  
    const tokenFound = await this.tokenRepository.findOne<Token>({where: {token: createPassDto.token}})
   
    if(!tokenFound){
      return{
        status:400,
        message:"invalid token",
        error:true
      }
    }
  
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(createPassDto.password)) {
      return {
        status: 400,
        message: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character',
        error: true
      };
    }
 
    const hashedPassword = await hash(createPassDto.password, 10);
     await User.update<User>({
       password: hashedPassword,
       isActive: true 
       },
       {
         where: {
           id: tokenFound.ownerId
         }
       }
     )
     
     await tokenFound.destroy();
     return {
        status: 200,
        message:"Password created successfully",
        error: false
     }
   }
   catch(e){
      return {
        status: 500,
        message:`Internal server error: ${e.message}`,
        error: true
      }
   }
  }

  async viewAccount(id: string){
    try{
      const account = await this.findUserById(id);
      return {
        status: 200,
        message: "Account details retrieved successfully",
        data: account,
        error: false
      }
    }
    catch(err){
       return{
         status: 500,
         message:`Internal server error: ${err.message}`,
         error: true
       }
    }
  }

  async deleteAccount(id: string){
    try{
      const account = await this.findUserById(id);
      if(!account){
         return {
           status: 400,
           message:"No account found with the specified id",
           error: true
         }
      }
      await account.destroy();
      return{
        status: 200,
        message:"account deleted successfully",
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

  async disableAccount(id: string){
    try{
      const account = await this.findUserById(id);
      if(!account){
         return {
           status: 400,
           message:"No account found with the specified id",
           error: true
         }
      }
      await this.userRepository.update({
        isActive:false,
      },
      {
        where: {
          id: id
        }
      })
     
      return{
        status: 200,
        message:"account disabled successfully",
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

  async enableAccount(id: string){
    try{
      const account = await this.findUserById(id);
      if(!account){
         return {
           status: 400,
           message:"No account found with the specified id",
           error: true
         }
      }
      await this.userRepository.update({
        isActive:true,
      },
      {
        where: {
          id: id
        }
      })
      return{
        status: 200,
        message:"account enabled successfully",
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

  async getSuperAdminDashboard(adminId: string){
     try{
       const user = await User.findByPk(adminId);
       if(!user){
          return {
             status:400,
             message:"Invalid Id",
             error: true
          }
       }

       const  itemBanks = await ItemFolder.findAll();
       const items = await Item.findAll();
       const onlineExams = await Exam.findAll({where:{deliveryMode:'online'}});
       const onpremiseExams = await Exam.findAll({where:{deliveryMode:'on-premise'}});
       
       return {
         status: 200,
         message:"Super-admin dashboard statistics retrieved successfully",
         data:{
          itemBanks:itemBanks.length,
          items: items.length,
          onlineExams:onlineExams.length,
          onpremiseExams: onpremiseExams.length
         },
         error: false
       }
     }
     catch(e){
        return {
           status:500,
           message:`An Error occured: ${e.message}`,
           error: true
        }
     }
  }

  async changePassword(passDto:ChangePasswordDto){
   try{
      const user = await User.findByPk(passDto.userId);
      if(!user){
        return {
          status: 400,
          message:"user not found",
          error: true
        }
      }

      if ( !(await compare(passDto.oldPassword, user.password))) {
        return {
          status: 400,
          message: 'Invalid credentials',
          error: true,
        };
      }

      if(passDto.password !== passDto.confirmPassword){
        return {
          status:400,
          message:"Passwords do not match",
          error: true
        }
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(passDto.password)) {
        return {
          status: 400,
          message: 'Password must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character',
          error:true
        };
      }


      const newHashedPassword = await hash(passDto.password,10);
      await this.userRepository.update<User>(
        {
         password:newHashedPassword,
        },{
        where: {
          id:user.id
        }   
       });
     
      await AuditLog.create({
        action: "Changed Password",
        userId:user.id
      });
       return {
         status: 200,
         message:"Password changed successfully",
         error: false
       }
   }
   catch(e){
     return {
       status: 500,
       message: `An Error occured: ${e.message}`,
       error: true
     }
   }
  }


  async updateProfile(profileDto: UpdateProfileDto){
    try{
      const user = await User.findByPk(profileDto.userId);
      if(!user){
         return {
           status:400,
           message:"Invalid user id",
           error: true
         }
      }
      await User.update({
        firstName: profileDto.firstName,
        lastName: profileDto.lastName,
        location:profileDto.location
      }, {where:{id: profileDto.userId}});

      await AuditLog.create({
        action: "Update Profile",
        userId:profileDto.userId
      });
      return {
         status: 200,
         message:"profile updated successfully",
         error: false
      }
    }
    catch(e){
      return {
         status:500,
         message: `An Error occurred: ${e.message}`,
         error: true
      }
    }
  }


  
  async updateAdmin(user,id:string,editDto: EditAdminDto){
    try{
      const {  firstName,lastName, RoleId} = editDto;
 
      const existingEmail = await this.userRepository.findOne<User>({ where: { id:id } })
     
      if(!existingEmail){
        return {
          status: 400,
          message:"Account not found",
          error: true
        }
      }
     
      const role = await Role.findByPk(RoleId);
      if(!role){
        return {
          status: 400,
          message:"Invalid role id",
          error: true
        }
      }
      await User.update({
        firstName: editDto.firstName,
        lastName:editDto.lastName,
        roleId: editDto.RoleId
      }, {where:{id: existingEmail.id}});

      await AuditLog.create({
        action: "Update Admin",
        userId:user.sub
      });
      return {
         status: 200,
         message:"Admin details updated successfully",
         error: false
      }
    }
    catch(e){
      return {
         status:500,
         message: `An Error occurred: ${e.message}`,
         error: true
      }
    }
  }


}


