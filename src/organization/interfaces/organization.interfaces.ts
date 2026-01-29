import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../dtos/organization.dto';
import { Organization } from 'src/utils/types';

export interface IOrganizationController {
  getOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: string): Promise<Organization>;
  createOrganization(
    organization: CreateOrganizationDto,
  ): Promise<Organization>;
  updateOrganization(
    id: string,
    organization: UpdateOrganizationDto,
  ): Promise<Organization>;
  deleteOrganization(id: string): Promise<Organization>;
}

export interface IOrganizationService {
  getOrganizations(): Promise<Organization[]>;
  getOrganizationById(id: string): Promise<Organization>;
  createOrganization(
    organization: CreateOrganizationDto,
  ): Promise<Organization>;
  updateOrganization(
    id: string,
    organization: UpdateOrganizationDto,
  ): Promise<Organization>;
  deleteOrganization(id: string): Promise<Organization>;
}
