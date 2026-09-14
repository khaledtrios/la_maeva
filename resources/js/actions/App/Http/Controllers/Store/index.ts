import StoreRegistrationController from './StoreRegistrationController'
import StoreAuthController from './StoreAuthController'
import StoreDashboardController from './StoreDashboardController'
const Store = {
    StoreRegistrationController: Object.assign(StoreRegistrationController, StoreRegistrationController),
StoreAuthController: Object.assign(StoreAuthController, StoreAuthController),
StoreDashboardController: Object.assign(StoreDashboardController, StoreDashboardController),
}

export default Store