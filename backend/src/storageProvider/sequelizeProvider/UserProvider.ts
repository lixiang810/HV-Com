/* eslint-disable class-methods-use-this */
import { v4 as uuidv4 } from 'uuid';
import IUserInDB, { IUserToCreate } from '../../../../types/IUser';
import StorageProvider from '../../../../types/StorageProvider';
import CUserProvider from '../../../../types/StorageProvider/CUserProvider';
import NotFoundError from '../../errors/NotFoundError';
import timeUtils from '../../utils/timeUtils';
import models from './models';
import { ISession } from './models/Session';

export default class UserProvider implements CUserProvider {
  constructor(parent: StorageProvider) {
    this.parent = parent;
  }

  async createUser(user: IUserToCreate): Promise<void> {
    const userToCreate: IUserInDB = {
      ...user,
      lastRevokeTime: timeUtils.getUnixStamp(),
    };
    await models.User.bulkCreate([userToCreate], { updateOnDuplicate: ['lastRevokeTime'] });
  }

  async getUser(
    { id, username }: { id?: string | undefined; username?: string | undefined },
    forAuth?: boolean,
  ) {
    const queryAry: (keyof IUserInDB)[] = [
      'avatar',
      'id',
      'username',
      'mail',
      'website',
      'trustLevel',
    ];
    if (forAuth) queryAry.push('password', 'lastRevokeTime');
    if (id) {
      const user = await models.User.findByPk(id, { attributes: queryAry });
      if (!user) return null;
      return user.toJSON();
    }
    if (username) {
      const user = await models.User.findOne({ where: { username }, attributes: queryAry });
      if (!user) return null;
      return user.toJSON();
    }
    return null;
  }

  async updateUser(userId: string, userInfo: Partial<IUserInDB>): Promise<void> {
    const userToUpdate = await models.User.findByPk(userId);
    if (!userToUpdate) throw new NotFoundError('用户不存在');
    await userToUpdate.update(userInfo);
  }

  async deleteUser(userId: string): Promise<void> {
    const userToDelete = await models.User.findByPk(userId);
    if (!userToDelete) throw new NotFoundError('用户不存在');
    await userToDelete.destroy();
  }

  async getUserBySession(sessionID: string): Promise<IUserInDB | null> {
    const res = await models.Session.findByPk(sessionID, {
      include: models.Session.associations.user,
    });
    if (!res || !res.user) return null;
    return res.user.toJSON();
  }

  async createSession(userID: string): Promise<ISession> {
    const res = await models.Session.create({ id: uuidv4(), userID });
    return res.toJSON();
  }

  parent: StorageProvider;
}
