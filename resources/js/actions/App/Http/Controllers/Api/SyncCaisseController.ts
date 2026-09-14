import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\SyncCaisseController::getEtab
 * @see app/Http/Controllers/Api/SyncCaisseController.php:35
 * @route '/api/sync-caisse/getetab'
 */
export const getEtab = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getEtab.url(options),
    method: 'get',
})

getEtab.definition = {
    methods: ["get","head"],
    url: '/api/sync-caisse/getetab',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\SyncCaisseController::getEtab
 * @see app/Http/Controllers/Api/SyncCaisseController.php:35
 * @route '/api/sync-caisse/getetab'
 */
getEtab.url = (options?: RouteQueryOptions) => {
    return getEtab.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SyncCaisseController::getEtab
 * @see app/Http/Controllers/Api/SyncCaisseController.php:35
 * @route '/api/sync-caisse/getetab'
 */
getEtab.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getEtab.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\SyncCaisseController::getEtab
 * @see app/Http/Controllers/Api/SyncCaisseController.php:35
 * @route '/api/sync-caisse/getetab'
 */
getEtab.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getEtab.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\SyncCaisseController::syncDataVente
 * @see app/Http/Controllers/Api/SyncCaisseController.php:49
 * @route '/api/sync-caisse'
 */
export const syncDataVente = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncDataVente.url(options),
    method: 'post',
})

syncDataVente.definition = {
    methods: ["post"],
    url: '/api/sync-caisse',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\SyncCaisseController::syncDataVente
 * @see app/Http/Controllers/Api/SyncCaisseController.php:49
 * @route '/api/sync-caisse'
 */
syncDataVente.url = (options?: RouteQueryOptions) => {
    return syncDataVente.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\SyncCaisseController::syncDataVente
 * @see app/Http/Controllers/Api/SyncCaisseController.php:49
 * @route '/api/sync-caisse'
 */
syncDataVente.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: syncDataVente.url(options),
    method: 'post',
})
const SyncCaisseController = { getEtab, syncDataVente }

export default SyncCaisseController