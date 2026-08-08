"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = exports.createContainer = void 0;
const auth_guard_1 = require("./common/auth/auth-guard");
const auth_routes_1 = require("./modules/auth/auth-routes");
const auth_service_1 = require("./modules/auth/auth-service");
const employee_auth_repository_1 = require("./modules/auth/employee-auth-repository");
const jwt_service_1 = require("./modules/auth/jwt-service");
const session_repository_1 = require("./modules/auth/session-repository");
const branch_repository_1 = require("./modules/branches/branch-repository");
const branch_routes_1 = require("./modules/branches/branch-routes");
const branch_service_1 = require("./modules/branches/branch-service");
const customer_repository_1 = require("./modules/customers/customer-repository");
const customer_routes_1 = require("./modules/customers/customer-routes");
const customer_service_1 = require("./modules/customers/customer-service");
const department_repository_1 = require("./modules/departments/department-repository");
const department_routes_1 = require("./modules/departments/department-routes");
const department_service_1 = require("./modules/departments/department-service");
const employee_repository_1 = require("./modules/employees/employee-repository");
const employee_routes_1 = require("./modules/employees/employee-routes");
const employee_service_1 = require("./modules/employees/employee-service");
const file_repository_1 = require("./modules/files/file-repository");
const file_routes_1 = require("./modules/files/file-routes");
const file_service_1 = require("./modules/files/file-service");
const storage_service_1 = require("./modules/files/storage-service");
const grave_site_repository_1 = require("./modules/grave-sites/grave-site-repository");
const grave_site_routes_1 = require("./modules/grave-sites/grave-site-routes");
const grave_site_service_1 = require("./modules/grave-sites/grave-site-service");
const order_repository_1 = require("./modules/orders/order-repository");
const order_routes_1 = require("./modules/orders/order-routes");
const order_service_1 = require("./modules/orders/order-service");
const createContainer = () => {
    const jwtService = new jwt_service_1.JwtService();
    const sessionRepository = new session_repository_1.SessionRepository();
    const employeeAuthRepository = new employee_auth_repository_1.EmployeeAuthRepository();
    const authService = new auth_service_1.AuthService(jwtService, sessionRepository, employeeAuthRepository);
    const authGuard = new auth_guard_1.AuthGuard(jwtService, employeeAuthRepository);
    const employeeRepository = new employee_repository_1.EmployeeRepository();
    const employeeService = new employee_service_1.EmployeeService(employeeRepository);
    const customerRepository = new customer_repository_1.CustomerRepository();
    const customerService = new customer_service_1.CustomerService(customerRepository);
    const graveSiteRepository = new grave_site_repository_1.GraveSiteRepository();
    const graveSiteService = new grave_site_service_1.GraveSiteService(graveSiteRepository);
    const orderRepository = new order_repository_1.OrderRepository();
    const orderService = new order_service_1.OrderService(orderRepository);
    const storageService = new storage_service_1.StorageService();
    const fileRepository = new file_repository_1.FileRepository();
    const fileService = new file_service_1.FileService(fileRepository, storageService);
    const branchRepository = new branch_repository_1.BranchRepository();
    const branchService = new branch_service_1.BranchService(branchRepository);
    const departmentRepository = new department_repository_1.DepartmentRepository();
    const departmentService = new department_service_1.DepartmentService(departmentRepository);
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
exports.createContainer = createContainer;
const registerRoutes = (app, container) => {
    (0, auth_routes_1.registerAuthRoutes)(app, container.authService, container.authGuard);
    (0, employee_routes_1.registerEmployeeRoutes)(app, container.employeeService, container.authGuard);
    (0, customer_routes_1.registerCustomerRoutes)(app, container.customerService, container.authGuard);
    (0, grave_site_routes_1.registerGraveSiteRoutes)(app, container.graveSiteService, container.authGuard);
    (0, order_routes_1.registerOrderRoutes)(app, container.orderService, container.authGuard);
    (0, file_routes_1.registerFileRoutes)(app, container.fileService, container.authGuard);
    (0, branch_routes_1.registerBranchRoutes)(app, container.branchService, container.authGuard);
    (0, department_routes_1.registerDepartmentRoutes)(app, container.departmentService, container.authGuard);
};
exports.registerRoutes = registerRoutes;
//# sourceMappingURL=container.js.map