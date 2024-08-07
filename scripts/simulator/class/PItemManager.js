import { PItem } from '../data/pItemData.js';

export class PItemManager {

    // property
    #pItemList;

    /**
     * コンストラクタ
     * @param {Array[Number]} idList - PアイテムのIDリスト
     */
    constructor (idList) {
        this.idList = idList;
        this.#pItemList = idList.map(id => new PItem(id));
    }

    /**
     * Pアイテムリストを返します
     * @returns {Array<PItem>}
     */
    getPItemList () {
        return this.#pItemList;
    }

    /**
     * 条件に合ったPアイテムリストを返します
     * @param {String}
     * @returns {Array<PItem>}
     */
    getByTiming (timing) {
        return this.#pItemList.filter(
            item => item.isAvailable() && 
            item.activate_timing == timing);
    }

}