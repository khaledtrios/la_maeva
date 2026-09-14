import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\FactureController::history
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
export const history = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(args, options),
    method: 'get',
})

history.definition = {
    methods: ["get","head"],
    url: '/factures/boutique/{boutique}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FactureController::history
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
history.url = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { boutique: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { boutique: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    boutique: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        boutique: typeof args.boutique === 'object'
                ? args.boutique.id
                : args.boutique,
                }

    return history.definition.url
            .replace('{boutique}', parsedArgs.boutique.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FactureController::history
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
history.get = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FactureController::history
 * @see app/Http/Controllers/FactureController.php:270
 * @route '/factures/boutique/{boutique}'
 */
history.head = (args: { boutique: number | { id: number } } | [boutique: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(args, options),
    method: 'head',
})
const boutique = {
    history: Object.assign(history, history),
}

export default boutique