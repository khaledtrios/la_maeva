import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
* @see \App\Http\Controllers\HaccpController::storeTemperature
 * @see app/Http/Controllers/HaccpController.php:88
 * @route '/haccp/temperatures'
 */
export const storeTemperature = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeTemperature.url(options),
    method: 'post',
})

storeTemperature.definition = {
    methods: ["post"],
    url: '/haccp/temperatures',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HaccpController::storeTemperature
 * @see app/Http/Controllers/HaccpController.php:88
 * @route '/haccp/temperatures'
 */
storeTemperature.url = (options?: RouteQueryOptions) => {
    return storeTemperature.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::storeTemperature
 * @see app/Http/Controllers/HaccpController.php:88
 * @route '/haccp/temperatures'
 */
storeTemperature.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeTemperature.url(options),
    method: 'post',
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
* @see \App\Http\Controllers\HaccpController::storeNettoyage
 * @see app/Http/Controllers/HaccpController.php:149
 * @route '/haccp/nettoyage'
 */
export const storeNettoyage = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeNettoyage.url(options),
    method: 'post',
})

storeNettoyage.definition = {
    methods: ["post"],
    url: '/haccp/nettoyage',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HaccpController::storeNettoyage
 * @see app/Http/Controllers/HaccpController.php:149
 * @route '/haccp/nettoyage'
 */
storeNettoyage.url = (options?: RouteQueryOptions) => {
    return storeNettoyage.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::storeNettoyage
 * @see app/Http/Controllers/HaccpController.php:149
 * @route '/haccp/nettoyage'
 */
storeNettoyage.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeNettoyage.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\HaccpController::updateNettoyage
 * @see app/Http/Controllers/HaccpController.php:172
 * @route '/haccp/nettoyage/{nettoyage}'
 */
export const updateNettoyage = (args: { nettoyage: number | { id: number } } | [nettoyage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateNettoyage.url(args, options),
    method: 'put',
})

updateNettoyage.definition = {
    methods: ["put"],
    url: '/haccp/nettoyage/{nettoyage}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\HaccpController::updateNettoyage
 * @see app/Http/Controllers/HaccpController.php:172
 * @route '/haccp/nettoyage/{nettoyage}'
 */
updateNettoyage.url = (args: { nettoyage: number | { id: number } } | [nettoyage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nettoyage: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { nettoyage: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    nettoyage: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        nettoyage: typeof args.nettoyage === 'object'
                ? args.nettoyage.id
                : args.nettoyage,
                }

    return updateNettoyage.definition.url
            .replace('{nettoyage}', parsedArgs.nettoyage.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::updateNettoyage
 * @see app/Http/Controllers/HaccpController.php:172
 * @route '/haccp/nettoyage/{nettoyage}'
 */
updateNettoyage.put = (args: { nettoyage: number | { id: number } } | [nettoyage: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateNettoyage.url(args, options),
    method: 'put',
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

/**
* @see \App\Http\Controllers\HaccpController::storeReceptionFournisseur
 * @see app/Http/Controllers/HaccpController.php:243
 * @route '/haccp/receptions-fournisseurs'
 */
export const storeReceptionFournisseur = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeReceptionFournisseur.url(options),
    method: 'post',
})

storeReceptionFournisseur.definition = {
    methods: ["post"],
    url: '/haccp/receptions-fournisseurs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\HaccpController::storeReceptionFournisseur
 * @see app/Http/Controllers/HaccpController.php:243
 * @route '/haccp/receptions-fournisseurs'
 */
storeReceptionFournisseur.url = (options?: RouteQueryOptions) => {
    return storeReceptionFournisseur.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\HaccpController::storeReceptionFournisseur
 * @see app/Http/Controllers/HaccpController.php:243
 * @route '/haccp/receptions-fournisseurs'
 */
storeReceptionFournisseur.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeReceptionFournisseur.url(options),
    method: 'post',
})
const HaccpController = { index, temperatures, storeTemperature, nettoyage, storeNettoyage, updateNettoyage, receptionsFournisseurs, storeReceptionFournisseur }

export default HaccpController