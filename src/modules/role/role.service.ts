import { Injectable, Inject } from '@nestjs/common';
import { hash } from 'bcryptjs';
import {Role } from '../role/role.entity';
import { ApiResponse } from 'src/app.interface';
import { InjectModel } from '@nestjs/sequelize';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolePermission } from './role-permission.entity';
import { Permission } from './permission.entity';
import { DefinedPermissions } from './dto/defined-permission.constant';
@Injectable()
export class RoleService {
  constructor(
    @Inject('ROLES_REPOSITORY')
    private  roleRepository: typeof Role,
    @Inject('ROLEPERMISSIONS_REPOSITORY')
    private rolePermissionRepository: typeof RolePermission,
    @Inject('PERMISSIONS_REPOSITORY')
    private permissionRepository: typeof Permission
  ) {}
  
  async createRole(createRoleDto: CreateRoleDto): Promise<ApiResponse>{
    try{
        const existingRole = await this.findRoleByName(createRoleDto.name);
        if(existingRole.data){
          return {
            status: 400,
            message: "role already exist",
            error: true
          }
        }
        const role = await this.roleRepository.create<Role>({
          name:createRoleDto.name,
          // description: createRoleDto.description
        });
        
        const permissions = await Permission.findAll({ where: { name: createRoleDto.priviledges } });

        // Associate permissions with the role
        // for (const permission of permissions) {
        //   await role.$add('Permission', permission.id); 
        // }
        for(let i =0; i< createRoleDto.priviledges.length; i++){
          await this.rolePermissionRepository.create<RolePermission>({
            roleId: role.id,
            permissionId:createRoleDto.priviledges[i]
          });
        }
        return {
            status: 200,
            message: "role created successfully",
            data:{
                id: role.id,
                name: createRoleDto.name,
                priviledges: createRoleDto.priviledges
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
 
  async findRoleByName(name: string): Promise<ApiResponse> {
    const role = await Role.findOne<Role>({
      where: { name },
      include: [{ model: Permission }]
    });

    return {
        status:200,
        message:"roles retrieved successfully",
        data:role,
        error: false
    }
  }

  async findRoleById(id: string): Promise<ApiResponse> {
    const role = await Role.findOne<Role>({
      where: { id: id },
      include: [{ model: Permission }], 
    });
    return {
        status:200,
        message:"roles retrieved successfully",
        data:role,
        error: false
    }
  }

  async getAllPermissions():Promise<ApiResponse>{
    const permissions = await this.permissionRepository.findAll<Permission>();
    let mappedPermissions = permissions.filter((p)=>{
        return ((p.name !== DefinedPermissions.AuthorAccess) && (p.name !== DefinedPermissions.CandidateAccess) && (p.name !== DefinedPermissions.LocalAdminAccess))
    })
    return {
       status: 200,
       data:mappedPermissions,
       message: "Permissions retrieved successfully",
       error: false
    }
  }
  
  async getAllRoles(): Promise<ApiResponse> {
    try {
      const rolesWithPermissions = await Role.findAll({
        include: [
          {
            model: Permission,
            attributes: ['id', 'name'], // Removed 'description' as it does not exist in DB
          },
        ],
      });
  
      let filteredResult = rolesWithPermissions.filter((rol) => rol.name !== "super-admin")
      const count = await Role.count(); // Total count of roles
  
      return {
        status: 200,
        message: 'Roles retrieved successfully',
        data: filteredResult,
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
  
 
  async editRole(id: string, editDto: CreateRoleDto): Promise<ApiResponse>{
    try{
        const existingRole = await this.roleRepository.findByPk<Role>(id);
        if(!existingRole){
          return {
            status: 400,
            message: "role not found",
            error: true
          }
        }
        await this.roleRepository.update<Role>(
            {
            name: editDto.name,
            // description:editDto.description,
            },
            {
            where : {id: id}
            }
         );

         const permissions = await Permission.findAll({ where: { name: editDto.priviledges } });

         // Associate permissions with the role
         for (const permission of permissions) {
           await existingRole.$add('Permission', permission.id); 
         }
        return {
            status: 200,
            message: "role updated successfully",
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

  async deleteRole(id: string){
    try{
      const role = await this.roleRepository.findOne<Role>({where:{id:id}})
      if(!role){
         return {
           status: 400,
           message:"No role found with the specified id",
           error: true
         }
      }
      await role.destroy();
      return{
        status: 200,
        message:"role deleted successfully",
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


