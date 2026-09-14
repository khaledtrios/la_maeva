import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\InventoryController::ingredient
 * @see app/Http/Controllers/InventoryController.php:296
 * @route '/inventory/create-ingredient'
 */
export const ingredient = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ingredient.url(options),
    method: 'post',
})

ingredient.definition = {
    methods: ["post"],
    url: '/inventory/create-ingredient',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\InventoryController::ingredient
 * @see app/Http/Controllers/InventoryController.php:296
 * @route '/inventory/create-ingredient'
 */
ingredient.url = (options?: RouteQueryOptions) => {
    return ingredient.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\InventoryController::ingredient
 * @see app/Http/Controllers/InventoryController.php:296
 * @route '/inventory/create-ingredient'
 */
ingredient.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ingredient.url(options),
    method: 'post',
})
const create = {
    ingredient: Object.assign(ingredient, ingredient),
}

export default create