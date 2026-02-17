const { v4: uuidv4 } = require('uuid');

const AvailablePermissions = {
  Authoring: 'Authoring',
  ItemBanks: 'ItemBanks',
  Exam: 'Exams',
  Setting: 'Settings',
  ProfileUpdate: 'ProfileUpdate',
  CandidateAccess: 'Candidate',
  AuthorAccess: 'Author',
  LocalAdminAccess: 'LocalAdmin',
};

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();

    const permissions = [
      {id:"e64c4026-1c28-48c1-a095-12d247aff4e8" ,name: AvailablePermissions.Authoring, createdAt: now, updatedAt: now },
      { id:"f64c4026-1c28-48c1-a095-12d247aff4f8",name: AvailablePermissions.Exam, createdAt: now, updatedAt: now },
      {id:"v64c4026-1c28-48c1-a095-12d247aff4eg", name: AvailablePermissions.ItemBanks, createdAt: now, updatedAt: now },
      {id:"e64c4026-1c28-48c1-a095-12d247aff4e9",name: AvailablePermissions.ProfileUpdate, createdAt: now, updatedAt: now },
      { id:"e64c4026-1c28-48c1-a095-12d247aff4h8",name: AvailablePermissions.Setting, createdAt: now, updatedAt: now },
      { id:"e64c4026-1c28-48c1-a095-12d247aff4e5",name: AvailablePermissions.CandidateAccess, createdAt: now, updatedAt: now },
      { id:"r64c4026-1c28-48c1-a095-12d247aff4e4", name: AvailablePermissions.AuthorAccess, createdAt: now, updatedAt: now },
      { id:"s64c4026-1c28-48c1-a095-12d247aff4e3",name: AvailablePermissions.LocalAdminAccess, createdAt: now, updatedAt: now },
    ];

    // Seed permissions
    for (const permission of permissions) {
      const existingPermission = await queryInterface.sequelize.query(
        `SELECT * FROM Permissions WHERE name = :name LIMIT 1`,
        {
          replacements: { name: permission.name },
          type: queryInterface.sequelize.QueryTypes.SELECT,
        }
      );

      if (!existingPermission.length) {
        await queryInterface.bulkInsert('Permissions', [permission], {});
      }
    }


    const roles = [
      {
        id: "e64c4026-1c28-48c1-a095-12d247aff4e7",
        name: 'local-admin',
        createdAt: now,
        updatedAt: now,
        permissions: [ AvailablePermissions.LocalAdminAccess],
      },
      {
        id: "2254fb66-c3b7-48b0-ae83-8103c207dc5f",
        name: 'author',
        createdAt: now,
        updatedAt: now,
        permissions: [ AvailablePermissions.AuthorAccess, AvailablePermissions.Authoring],
      },
      {
        id: "a42a6eb9-5549-4ea5-952a-97c7d832cce2",
        name: 'candidate',
        createdAt: now,
        updatedAt: now,
        permissions: [ AvailablePermissions.CandidateAccess],
      },
      {
        id: "34d741b3-8355-486a-b8f2-547a9f308d7f",
        name: 'super-admin',
        createdAt: now,
        updatedAt: now,
        permissions: [ AvailablePermissions.Exam, AvailablePermissions.ItemBanks, AvailablePermissions.Setting, AvailablePermissions.ProfileUpdate, AvailablePermissions.Authoring, AvailablePermissions.AuthorAccess],
      },
    ];
   

    // const rolePermissions = roles.map((role) => ({
    //   id: uuidv4(),
    //   RoleId: role.id,
    //   PermissionId: permissions
    //     .filter((perm) => role.permissions.includes(perm.name))
    //     .map((perm) => perm.id),
    //   createdAt: now,
    //   updatedAt: now,
    // }));
    
    //  console.log(rolePermissions);
    const users = [
      { 
        id: uuidv4(), 
        email:"newsuperadmin@yopmail.com",
        password:"$2y$12$KRu7dZtBjQN7L7V7ALMjV.3mbMs6wHzoVfCSuF6P6M8dwTG4yoEO2",
        firstName:"super",
        lastName:"admin",
        isActive:true,
        createdAt: now,
        updatedAt: now,
        roleId:"34d741b3-8355-486a-b8f2-547a9f308d7f"
        }
      
    ];
  
    let rolesToCreate = roles.map((r) => ({
      id: r.id,
      name:r.name,
      createdAt: now,
      updatedAt: now,
    }))
    await queryInterface.bulkInsert('Roles', rolesToCreate, {});

    for(let r of roles){
      for(let perm of r.permissions){
        const permission = permissions.find((p) => p.name == perm)

        await queryInterface.bulkInsert('RolePermissions',[{
          id: uuidv4(),
          RoleId: r.id,
          PermissionId:permission.id,
          createdAt: now,
          updatedAt: now,
        }],{})
      }
    }

    
    await queryInterface.bulkInsert('Users', users, {});
  },

  down: async (queryInterface) => {
    // Remove roles and associated permissions
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Roles', null, {});

    await queryInterface.bulkDelete('Permissions', null, {});

    await queryInterface.bulkInsert('Users', null, {});

    return Promise.resolve();
  },
};
