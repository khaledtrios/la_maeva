import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ReceptionController::index
 * @see app/Http/Controllers/ReceptionController.php:19
 * @route '/receptions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/receptions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReceptionController::index
 * @see app/Http/Controllers/ReceptionController.php:19
 * @route '/receptions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReceptionController::index
 * @see app/Http/Controllers/ReceptionController.php:19
 * @route '/receptions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReceptionController::index
 * @see app/Http/Controllers/ReceptionController.php:19
 * @route '/receptions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ReceptionController::confirm
 * @see app/Http/Controllers/ReceptionController.php:58
 * @route '/receptions/{reception}/confirm'
 */
export const confirm = (args: { reception: number | { id: number } } | [reception: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(args, options),
    method: 'post',
})

confirm.definition = {
    methods: ["post"],
    url: '/receptions/{reception}/confirm',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ReceptionController::confirm
 * @see app/Http/Controllers/ReceptionController.php:58
 * @route '/receptions/{reception}/confirm'
 */
confirm.url = (args: { reception: number | { id: number } } | [reception: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { reception: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { reception: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    reception: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        reception: typeof args.reception === 'object'
                ? args.reception.id
                : args.reception,
                }

    return confirm.definition.url
            .replace('{reception}', parsedArgs.reception.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReceptionController::confirm
 * @see app/Http/Controllers/ReceptionController.php:58
 * @route '/receptions/{reception}/confirm'
 */
confirm.post = (args: { reception: number | { id: number } } | [reception: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(args, options),
    method: 'post',
})
const receptions = {
    index: Object.assign(index, index),
confirm: Object.assign(confirm, confirm),
}

export default receptions