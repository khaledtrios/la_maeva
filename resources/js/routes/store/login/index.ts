import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Store\StoreAuthController::submit
 * @see app/Http/Controllers/Store/StoreAuthController.php:24
 * @route '/store/login'
 */
export const submit = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/store/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Store\StoreAuthController::submit
 * @see app/Http/Controllers/Store/StoreAuthController.php:24
 * @route '/store/login'
 */
submit.url = (options?: RouteQueryOptions) => {
    return submit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Store\StoreAuthController::submit
 * @see app/Http/Controllers/Store/StoreAuthController.php:24
 * @route '/store/login'
 */
submit.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(options),
    method: 'post',
})
const login = {
    submit: Object.assign(submit, submit),
}

export default login