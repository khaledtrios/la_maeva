import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/facture-settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\AdminController::index
 * @see app/Http/Controllers/AdminController.php:202
 * @route '/admin/facture-settings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\AdminController::toggleAuto
 * @see app/Http/Controllers/AdminController.php:215
 * @route '/admin/facture-settings/toggle-auto'
 */
export const toggleAuto = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleAuto.url(options),
    method: 'post',
})

toggleAuto.definition = {
    methods: ["post"],
    url: '/admin/facture-settings/toggle-auto',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\AdminController::toggleAuto
 * @see app/Http/Controllers/AdminController.php:215
 * @route '/admin/facture-settings/toggle-auto'
 */
toggleAuto.url = (options?: RouteQueryOptions) => {
    return toggleAuto.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AdminController::toggleAuto
 * @see app/Http/Controllers/AdminController.php:215
 * @route '/admin/facture-settings/toggle-auto'
 */
toggleAuto.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleAuto.url(options),
    method: 'post',
})
const factureSettings = {
    index: Object.assign(index, index),
toggleAuto: Object.assign(toggleAuto, toggleAuto),
}

export default factureSettings