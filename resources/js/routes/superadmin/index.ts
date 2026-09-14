import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import loginDf2c2a from './login'
import stores from './stores'
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::login
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/super-admin/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::login
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::login
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::login
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::logout
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:36
 * @route '/super-admin/logout'
 */
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/super-admin/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::logout
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:36
 * @route '/super-admin/logout'
 */
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::logout
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:36
 * @route '/super-admin/logout'
 */
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})
const superadmin = {
    login: Object.assign(login, loginDf2c2a),
logout: Object.assign(logout, logout),
stores: Object.assign(stores, stores),
}

export default superadmin