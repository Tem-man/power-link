import router from "../index"

export const goToView = (path, params = {}) => {
    router.push({
        path,
        query: { ...params }
    })
}
