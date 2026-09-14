import Api from './Api'
import AuthController from './AuthController'
import Store from './Store'
import DashboardController from './DashboardController'
import ProductController from './ProductController'
import CategoryController from './CategoryController'
import IngredientController from './IngredientController'
import InventoryController from './InventoryController'
import StockMovementController from './StockMovementController'
import StockController from './StockController'
import ProductionController from './ProductionController'
import ExpeditionController from './ExpeditionController'
import ReceptionController from './ReceptionController'
import CommandeUrgenteController from './CommandeUrgenteController'
import ReturnController from './ReturnController'
import SaleController from './SaleController'
import HaccpController from './HaccpController'
import NonConformiteController from './NonConformiteController'
import ReportingController from './ReportingController'
import AdminController from './AdminController'
import SuperAdmin from './SuperAdmin'
import FactureController from './FactureController'
const Controllers = {
    Api: Object.assign(Api, Api),
AuthController: Object.assign(AuthController, AuthController),
Store: Object.assign(Store, Store),
DashboardController: Object.assign(DashboardController, DashboardController),
ProductController: Object.assign(ProductController, ProductController),
CategoryController: Object.assign(CategoryController, CategoryController),
IngredientController: Object.assign(IngredientController, IngredientController),
InventoryController: Object.assign(InventoryController, InventoryController),
StockMovementController: Object.assign(StockMovementController, StockMovementController),
StockController: Object.assign(StockController, StockController),
ProductionController: Object.assign(ProductionController, ProductionController),
ExpeditionController: Object.assign(ExpeditionController, ExpeditionController),
ReceptionController: Object.assign(ReceptionController, ReceptionController),
CommandeUrgenteController: Object.assign(CommandeUrgenteController, CommandeUrgenteController),
ReturnController: Object.assign(ReturnController, ReturnController),
SaleController: Object.assign(SaleController, SaleController),
HaccpController: Object.assign(HaccpController, HaccpController),
NonConformiteController: Object.assign(NonConformiteController, NonConformiteController),
ReportingController: Object.assign(ReportingController, ReportingController),
AdminController: Object.assign(AdminController, AdminController),
SuperAdmin: Object.assign(SuperAdmin, SuperAdmin),
FactureController: Object.assign(FactureController, FactureController),
}

export default Controllers