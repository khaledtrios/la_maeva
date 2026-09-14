import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import register702019 from './register'
import loginDf2c2a from './login'
/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::register
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:18
 * @route '/register'
 */
export const register = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

register.definition = {
    methods: ["get","head"],
    url: '/register',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::register
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:18
 * @route '/register'
 */
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::register
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:18
 * @route '/register'
 */
register.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Store\StoreRegistrationController::register
 * @see app/Http/Controllers/Store/StoreRegistrationController.php:18
 * @route '/register'
 */
register.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: register.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Store\StoreAuthController::login
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/store/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Store\StoreAuthController::login
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreAuthController::login
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Store\StoreAuthController::login
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Store\StoreAuthController::logout
 * @see app/Http/Controllers/Store/StoreAuthController.php:36
 * @route '/store/logout'
 */
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/store/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Store\StoreAuthController::logout
 * @see app/Http/Controllers/Store/StoreAuthController.php:36
 * @route '/store/logout'
 */
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreAuthController::logout
 * @see app/Http/Controllers/Store/StoreAuthController.php:36
 * @route '/store/logout'
 */
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Store\StoreDashboardController::dashboard
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/store/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Store\StoreDashboardController::dashboard
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreDashboardController::dashboard
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Store\StoreDashboardController::dashboard
 * @see app/Http/Controllers/Store/StoreDashboardController.php:14
 * @route '/store/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})
/**
 * Store CRM Routes - Production
 */
export const production = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: production.url(options),
    method: 'get',
})

production.definition = {
    methods: ["get","head"],
    url: '/store/production',
} satisfies RouteDefinition<["get","head"]>

production.url = (options?: RouteQueryOptions) => {
    return production.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Products
 */
export const products = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: products.url(options),
    method: 'get',
})

products.definition = {
    methods: ["get","head"],
    url: '/store/products',
} satisfies RouteDefinition<["get","head"]>

products.url = (options?: RouteQueryOptions) => {
    return products.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Stocks
 */
export const stocks = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: stocks.url(options),
    method: 'get',
})

stocks.definition = {
    methods: ["get","head"],
    url: '/store/stocks',
} satisfies RouteDefinition<["get","head"]>

stocks.url = (options?: RouteQueryOptions) => {
    return stocks.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Inventory
 */
export const inventory = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(options),
    method: 'get',
})

inventory.definition = {
    methods: ["get","head"],
    url: '/store/inventory',
} satisfies RouteDefinition<["get","head"]>

inventory.url = (options?: RouteQueryOptions) => {
    return inventory.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - HACCP
 */
export const haccp = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: haccp.url(options),
    method: 'get',
})

haccp.definition = {
    methods: ["get","head"],
    url: '/store/haccp',
} satisfies RouteDefinition<["get","head"]>

haccp.url = (options?: RouteQueryOptions) => {
    return haccp.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Facturation
 */
export const facturation = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: facturation.url(options),
    method: 'get',
})

facturation.definition = {
    methods: ["get","head"],
    url: '/store/facturation',
} satisfies RouteDefinition<["get","head"]>

facturation.url = (options?: RouteQueryOptions) => {
    return facturation.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Reporting
 */
export const reporting = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reporting.url(options),
    method: 'get',
})

reporting.definition = {
    methods: ["get","head"],
    url: '/store/reporting',
} satisfies RouteDefinition<["get","head"]>

reporting.url = (options?: RouteQueryOptions) => {
    return reporting.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Expeditions
 */
export const expeditions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expeditions.url(options),
    method: 'get',
})

expeditions.definition = {
    methods: ["get","head"],
    url: '/store/expeditions',
} satisfies RouteDefinition<["get","head"]>

expeditions.url = (options?: RouteQueryOptions) => {
    return expeditions.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Receptions
 */
export const receptions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: receptions.url(options),
    method: 'get',
})

receptions.definition = {
    methods: ["get","head"],
    url: '/store/receptions',
} satisfies RouteDefinition<["get","head"]>

receptions.url = (options?: RouteQueryOptions) => {
    return receptions.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Returns
 */
export const returns = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: returns.url(options),
    method: 'get',
})

returns.definition = {
    methods: ["get","head"],
    url: '/store/returns',
} satisfies RouteDefinition<["get","head"]>

returns.url = (options?: RouteQueryOptions) => {
    return returns.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Sales
 */
export const sales = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: sales.url(options),
    method: 'get',
})

sales.definition = {
    methods: ["get","head"],
    url: '/store/sales',
} satisfies RouteDefinition<["get","head"]>

sales.url = (options?: RouteQueryOptions) => {
    return sales.definition.url + queryParams(options)
}

/**
 * Store CRM Routes - Incidents (Non-conformités)
 */
export const incidents = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: incidents.url(options),
    method: 'get',
})

incidents.definition = {
    methods: ["get","head"],
    url: '/store/nonconformites',
} satisfies RouteDefinition<["get","head"]>

incidents.url = (options?: RouteQueryOptions) => {
    return incidents.definition.url + queryParams(options)
}

/**
 * Store Admin Routes - Admin Dashboard
 */
export const admin = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: admin.url(options),
    method: 'get',
})

admin.definition = {
    methods: ["get","head"],
    url: '/store/admin',
} satisfies RouteDefinition<["get","head"]>

admin.url = (options?: RouteQueryOptions) => {
    return admin.definition.url + queryParams(options)
}

/**
 * Store Admin Routes - Employees Management
 */
export const employees = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: employees.url(options),
    method: 'get',
})

employees.definition = {
    methods: ["get","head"],
    url: '/store/admin/employees',
} satisfies RouteDefinition<["get","head"]>

employees.url = (options?: RouteQueryOptions) => {
    return employees.definition.url + queryParams(options)
}

/**
 * Store Admin Routes - Settings
 */
export const settings = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: settings.url(options),
    method: 'get',
})

settings.definition = {
    methods: ["get","head"],
    url: '/store/admin/settings',
} satisfies RouteDefinition<["get","head"]>

settings.url = (options?: RouteQueryOptions) => {
    return settings.definition.url + queryParams(options)
}

const store = {
    register: Object.assign(register, register702019),
login: Object.assign(login, loginDf2c2a),
logout: Object.assign(logout, logout),
dashboard: Object.assign(dashboard, dashboard),
production: Object.assign(production, production),
products: Object.assign(products, products),
stocks: Object.assign(stocks, stocks),
inventory: Object.assign(inventory, inventory),
haccp: Object.assign(haccp, haccp),
facturation: Object.assign(facturation, facturation),
reporting: Object.assign(reporting, reporting),
expeditions: Object.assign(expeditions, expeditions),
receptions: Object.assign(receptions, receptions),
returns: Object.assign(returns, returns),
sales: Object.assign(sales, sales),
incidents: Object.assign(incidents, incidents),
admin: Object.assign(admin, admin),
employees: Object.assign(employees, employees),
settings: Object.assign(settings, settings),
}

export default store