import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import temperatures1050a7 from './temperatures'
import nettoyage453131 from './nettoyage'
import receptionsFournisseurs14ff24 from './receptions-fournisseurs'
/**
* @see \App\Http\Controllers\HaccpController::index
 * @see app/Http/Controllers/HaccpController.php:21
 * @route '/haccp'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/haccp',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HaccpController::index
 * @see app/Http/Controllers/HaccpController.php:21
 * @route '/haccp'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::index
 * @see app/Http/Controllers/HaccpController.php:21
 * @route '/haccp'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HaccpController::index
 * @see app/Http/Controllers/HaccpController.php:21
 * @route '/haccp'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HaccpController::temperatures
 * @see app/Http/Controllers/HaccpController.php:57
 * @route '/haccp/temperatures'
 */
export const temperatures = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: temperatures.url(options),
    method: 'get',
})

temperatures.definition = {
    methods: ["get","head"],
    url: '/haccp/temperatures',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HaccpController::temperatures
 * @see app/Http/Controllers/HaccpController.php:57
 * @route '/haccp/temperatures'
 */
temperatures.url = (options?: RouteQueryOptions) => {
    return temperatures.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::temperatures
 * @see app/Http/Controllers/HaccpController.php:57
 * @route '/haccp/temperatures'
 */
temperatures.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: temperatures.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HaccpController::temperatures
 * @see app/Http/Controllers/HaccpController.php:57
 * @route '/haccp/temperatures'
 */
temperatures.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: temperatures.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HaccpController::nettoyage
 * @see app/Http/Controllers/HaccpController.php:118
 * @route '/haccp/nettoyage'
 */
export const nettoyage = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: nettoyage.url(options),
    method: 'get',
})

nettoyage.definition = {
    methods: ["get","head"],
    url: '/haccp/nettoyage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HaccpController::nettoyage
 * @see app/Http/Controllers/HaccpController.php:118
 * @route '/haccp/nettoyage'
 */
nettoyage.url = (options?: RouteQueryOptions) => {
    return nettoyage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::nettoyage
 * @see app/Http/Controllers/HaccpController.php:118
 * @route '/haccp/nettoyage'
 */
nettoyage.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: nettoyage.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HaccpController::nettoyage
 * @see app/Http/Controllers/HaccpController.php:118
 * @route '/haccp/nettoyage'
 */
nettoyage.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: nettoyage.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\HaccpController::receptionsFournisseurs
 * @see app/Http/Controllers/HaccpController.php:210
 * @route '/haccp/receptions-fournisseurs'
 */
export const receptionsFournisseurs = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: receptionsFournisseurs.url(options),
    method: 'get',
})

receptionsFournisseurs.definition = {
    methods: ["get","head"],
    url: '/haccp/receptions-fournisseurs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\HaccpController::receptionsFournisseurs
 * @see app/Http/Controllers/HaccpController.php:210
 * @route '/haccp/receptions-fournisseurs'
 */
receptionsFournisseurs.url = (options?: RouteQueryOptions) => {
    return receptionsFournisseurs.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::receptionsFournisseurs
 * @see app/Http/Controllers/HaccpController.php:210
 * @route '/haccp/receptions-fournisseurs'
 */
receptionsFournisseurs.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: receptionsFournisseurs.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\HaccpController::receptionsFournisseurs
 * @see app/Http/Controllers/HaccpController.php:210
 * @route '/haccp/receptions-fournisseurs'
 */
receptionsFournisseurs.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: receptionsFournisseurs.url(options),
    method: 'head',
})
const haccp = {
    index: Object.assign(index, index),
temperatures: Object.assign(temperatures, temperatures1050a7),
nettoyage: Object.assign(nettoyage, nettoyage453131),
receptionsFournisseurs: Object.assign(receptionsFournisseurs, receptionsFournisseurs14ff24),
}

export default haccp