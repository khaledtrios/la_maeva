import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
import lots from './lots'
import create from './create'
import movements from './movements'
/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\InventoryController::index
 * @see app/Http/Controllers/InventoryController.php:22
 * @route '/inventory'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\InventoryController::adjustBatch
 * @see app/Http/Controllers/InventoryController.php:362
 * @route '/inventory/adjust-batch'
 */
export const adjustBatch = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: adjustBatch.url(options),
    method: 'put',
})

adjustBatch.definition = {
    methods: ["put"],
    url: '/inventory/adjust-batch',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventoryController::adjustBatch
 * @see app/Http/Controllers/InventoryController.php:362
 * @route '/inventory/adjust-batch'
 */
adjustBatch.url = (options?: RouteQueryOptions) => {
    return adjustBatch.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::adjustBatch
 * @see app/Http/Controllers/InventoryController.php:362
 * @route '/inventory/adjust-batch'
 */
adjustBatch.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: adjustBatch.url(options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:235
 * @route '/inventory/{ingredient}'
 */
export const update = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/inventory/{ingredient}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:235
 * @route '/inventory/{ingredient}'
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
* @see \App\Http\Controllers\InventoryController::update
 * @see app/Http/Controllers/InventoryController.php:235
 * @route '/inventory/{ingredient}'
 */
update.put = (args: { ingredient: number | { id: number } } | [ingredient: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
const inventory = {
    index: Object.assign(index, index),
lots: Object.assign(lots, lots),
adjustBatch: Object.assign(adjustBatch, adjustBatch),
update: Object.assign(update, update),
create: Object.assign(create, create),
movements: Object.assign(movements, movements),
}

export default inventory