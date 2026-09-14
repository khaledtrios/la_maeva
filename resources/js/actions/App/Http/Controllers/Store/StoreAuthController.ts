import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Store\StoreAuthController::create
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/store/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Store\StoreAuthController::create
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreAuthController::create
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Store\StoreAuthController::create
 * @see app/Http/Controllers/Store/StoreAuthController.php:16
 * @route '/store/login'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Store\StoreAuthController::store
 * @see app/Http/Controllers/Store/StoreAuthController.php:24
 * @route '/store/login'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/store/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Store\StoreAuthController::store
 * @see app/Http/Controllers/Store/StoreAuthController.php:24
 * @route '/store/login'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreAuthController::store
 * @see app/Http/Controllers/Store/StoreAuthController.php:24
 * @route '/store/login'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Store\StoreAuthController::destroy
 * @see app/Http/Controllers/Store/StoreAuthController.php:36
 * @route '/store/logout'
 */
export const destroy = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: destroy.url(options),
    method: 'post',
})

destroy.definition = {
    methods: ["post"],
    url: '/store/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Store\StoreAuthController::destroy
 * @see app/Http/Controllers/Store/StoreAuthController.php:36
 * @route '/store/logout'
 */
destroy.url = (options?: RouteQueryOptions) => {
    return destroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreAuthController::destroy
 * @see app/Http/Controllers/Store/StoreAuthController.php:36
 * @route '/store/logout'
 */
destroy.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: destroy.url(options),
    method: 'post',
})
const StoreAuthController = { create, store, destroy }

export default StoreAuthController