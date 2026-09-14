import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::create
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/super-admin/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::create
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::create
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::create
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:16
 * @route '/super-admin/login'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::store
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:24
 * @route '/super-admin/login'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/super-admin/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::store
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:24
 * @route '/super-admin/login'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::store
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:24
 * @route '/super-admin/login'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::destroy
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:36
 * @route '/super-admin/logout'
 */
export const destroy = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: destroy.url(options),
    method: 'post',
})

destroy.definition = {
    methods: ["post"],
    url: '/super-admin/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::destroy
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:36
 * @route '/super-admin/logout'
 */
destroy.url = (options?: RouteQueryOptions) => {
    return destroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminAuthController::destroy
 * @see app/Http/Controllers/SuperAdmin/SuperAdminAuthController.php:36
 * @route '/super-admin/logout'
 */
destroy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: destroy.url(options),
    method: 'post',
})
const SuperAdminAuthController = { create, store, destroy }

export default SuperAdminAuthController