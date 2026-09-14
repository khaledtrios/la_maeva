import SuperAdminAuthController from './SuperAdminAuthController'
import StoreManagementController from './StoreManagementController'
const SuperAdmin = {
    SuperAdminAuthController: Object.assign(SuperAdminAuthController, SuperAdminAuthController),
StoreManagementController: Object.assign(StoreManagementController, StoreManagementController),
}

export default SuperAdmin