import type { FastifyInstance } from 'fastify';

import { AuthGuard } from './common/auth/auth-guard';
import { registerAuthRoutes } from './modules/auth/auth-routes';
import { AuthService } from './modules/auth/auth-service';
import { EmployeeAuthRepository } from './modules/auth/employee-auth-repository';
import { JwtService } from './modules/auth/jwt-service';
import { SessionRepository } from './modules/auth/session-repository';
import { BranchRepository } from './modules/branches/branch-repository';
import { registerBranchRoutes } from './modules/branches/branch-routes';
import { BranchService } from './modules/branches/branch-service';
import { CustomerRepository } from './modules/customers/customer-repository';
import { registerCustomerRoutes } from './modules/customers/customer-routes';
import { CustomerService } from './modules/customers/customer-service';
import { DepartmentRepository } from './modules/departments/department-repository';
import { registerDepartmentRoutes } from './modules/departments/department-routes';
import { DepartmentService } from './modules/departments/department-service';
import { EmployeeRepository } from './modules/employees/employee-repository';
import { registerEmployeeRoutes } from './modules/employees/employee-routes';
import { EmployeeService } from './modules/employees/employee-service';
import { FileRepository } from './modules/files/file-repository';
import { registerFileRoutes } from './modules/files/file-routes';
import { FileService } from './modules/files/file-service';
import { StorageService } from './modules/files/storage-service';
import { GraveSiteRepository } from './modules/grave-sites/grave-site-repository';
import { registerGraveSiteRoutes } from './modules/grave-sites/grave-site-routes';
import { GraveSiteService } from './modules/grave-sites/grave-site-service';
import { OrderRepository } from './modules/orders/order-repository';
import { registerOrderRoutes } from './modules/orders/order-routes';
import { OrderService } from './modules/orders/order-service';

export interface AppContainer {
  readonly authGuard: AuthGuard;
  readonly authService: AuthService;
  readonly employeeService: EmployeeService;
  readonly customerService: CustomerService;
  readonly graveSiteService: GraveSiteService;
  readonly orderService: OrderService;
  readonly fileService: FileService;
  readonly branchService: BranchService;
  readonly departmentService: DepartmentService;
  readonly storageService: StorageService;
}

export const createContainer = (): AppContainer => {
  const jwtService = new JwtService();
  const sessionRepository = new SessionRepository();
  const employeeAuthRepository = new EmployeeAuthRepository();

  const authService = new AuthService(
    jwtService,
    sessionRepository,
    employeeAuthRepository,
  );

  const authGuard = new AuthGuard(jwtService, employeeAuthRepository);

  const employeeRepository = new EmployeeRepository();
  const employeeService = new EmployeeService(employeeRepository);

  const customerRepository = new CustomerRepository();
  const customerService = new CustomerService(customerRepository);

  const graveSiteRepository = new GraveSiteRepository();
  const graveSiteService = new GraveSiteService(graveSiteRepository);

  const orderRepository = new OrderRepository();
  const orderService = new OrderService(orderRepository);

  const storageService = new StorageService();
  const fileRepository = new FileRepository();
  const fileService = new FileService(fileRepository, storageService);

  const branchRepository = new BranchRepository();
  const branchService = new BranchService(branchRepository);

  const departmentRepository = new DepartmentRepository();
  const departmentService = new DepartmentService(departmentRepository);

  return {
    authGuard,
    authService,
    employeeService,
    customerService,
    graveSiteService,
    orderService,
    fileService,
    branchService,
    departmentService,
    storageService,
  };
};

export const registerRoutes = (
  app: FastifyInstance,
  container: AppContainer,
): void => {
  registerAuthRoutes(app, container.authService, container.authGuard);
  registerEmployeeRoutes(app, container.employeeService, container.authGuard);
  registerCustomerRoutes(app, container.customerService, container.authGuard);
  registerGraveSiteRoutes(app, container.graveSiteService, container.authGuard);
  registerOrderRoutes(app, container.orderService, container.authGuard);
  registerFileRoutes(app, container.fileService, container.authGuard);
  registerBranchRoutes(app, container.branchService, container.authGuard);
  registerDepartmentRoutes(
    app,
    container.departmentService,
    container.authGuard,
  );
};