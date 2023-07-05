export default {

    /**
     * Сохраняет данные в хранилище
     * @param itemName
     * @param itemBody
     * @param ttl
     */
    setItem(itemName, itemBody, ttl = null) {
        localStorage.setItem(itemName, JSON.stringify(itemBody));
    },


    /**
     * Получает данные из хранилища
     * @param itemName
     * @returns {any|null}
     */
    getItem(itemName) {
        try {
            return JSON.parse(localStorage.getItem(itemName));
        } catch (e) {
            return null;
        }
    }
}
