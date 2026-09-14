import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\IngredientController::store
 * @see app/Http/Controllers/IngredientController.php:11
 * @route '/ingredients'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/ingredients',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\IngredientController::store
 * @see app/Http/Controllers/IngredientController.php:11
 * @route '/ingredients'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\IngredientController::store
 * @see app/Http/Controllers/IngredientController.php:11
 * @route '/ingredients'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\IngredientController::update
 * @see app/Http/Controllers/IngredientController.php:24
 * @route '/ingredients/{ingredient}'
 */
export const update = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/ingredients/{ingredient}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\IngredientController::update
 * @see app/Http/Controllers/IngredientController.php:24
 * @route '/ingredients/{ingredient}'
 */
update.url = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ingredient: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { ingredient: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    ingredient: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ingredient: typeof args.ingredient === 'object'
                ? args.ingredient.id
                : args.ingredient,
                }

    return update.definition.url
            .replace('{ingredient}', parsedArgs.ingredient.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\IngredientController::update
 * @see app/Http/Controllers/IngredientController.php:24
 * @route '/ingredients/{ingredient}'
 */
update.put = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\IngredientController::destroy
 * @see app/Http/Controllers/IngredientController.php:37
 * @route '/ingredients/{ingredient}'
 */
export const destroy = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/ingredients/{ingredient}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\IngredientController::destroy
 * @see app/Http/Controllers/IngredientController.php:37
 * @route '/ingredients/{ingredient}'
 */
destroy.url = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { ingredient: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { ingredient: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    ingredient: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        ingredient: typeof args.ingredient === 'object'
                ? args.ingredient.id
                : args.ingredient,
                }

    return destroy.definition.url
            .replace('{ingredient}', parsedArgs.ingredient.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\IngredientController::destroy
 * @see app/Http/Controllers/IngredientController.php:37
 * @route '/ingredients/{ingredient}'
 */
destroy.delete = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})
const IngredientController = { store, update, destroy }

export default IngredientController