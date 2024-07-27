import { PIdolData } from './simulator/data/pIdolData.js';
import { SkillCardData } from './simulator/data/skillCardData.js';
import { ContestData } from './simulator/data/contestData.js';
import { PItemData } from './simulator/data/pItemData.js';
import { run } from './simulator/run.js';

function DOM_text_to_elememt (text) {
    const temporaryDiv = document.createElement('div');
    temporaryDiv.innerHTML = text;
    return temporaryDiv.firstElementChild;
}

function DOM_delete_allChildren (parent) {
    while(parent.firstChild){
        parent.removeChild(parent.firstChild);
    }
}

function DOM_set_contest (parent) {
    const fragment = document.createDocumentFragment();
    ContestData.getAll().forEach(item=>{
        const option = document.createElement('option');
        option.innerHTML = `${item.name} [Vo${item.criteria['vocal']} Da${item.criteria['dance']} Vi${item.criteria['visual']}]`;
        option.value = item.id;
        fragment.appendChild(option);
    });
    DOM_delete_allChildren(parent);
    parent.appendChild(fragment);
}

function DOM_set_characterCards (parent, number, type) {
    const textElement_card = `
    <div class="character-cards">
        <div class="card-container-item">
            <input type="checkbox" id="checkbox" class="checkbox">
            <label for="checkbox" class="checkbox-label"></label>
            <select class="select-box">
                <option value="-1">-</option>
            </select>
        </div>
    </div>`;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < number; i++) {
        const element = DOM_text_to_elememt(textElement_card);
        element.querySelector('input#checkbox').id = `checkbox_${type}_${i}`;
        element.querySelector('label').htmlFor = `checkbox_${type}_${i}`;
        fragment.appendChild(element);
    }
    DOM_delete_allChildren(parent);
    parent.appendChild(fragment);
    return Array.from(parent.children).map(element=>element.querySelector('select'));
}

function DOM_set_character (parent, pIdolList) {
    const fragment = document.createDocumentFragment();
    pIdolList.forEach(item=>{
        const option = document.createElement('option');
        option.innerHTML = `${item.rarity} [${item.epidode_name}] ${item.name}`
        option.value = item.id;
        fragment.appendChild(option);
    });
    DOM_delete_allChildren(parent);
    parent.appendChild(fragment);
}

function DOM_set_select_options (select, item_list, isBlank) {
    const fragment = document.createDocumentFragment();
    if (isBlank) {
        const option = document.createElement('option');
        option.innerHTML = '-';
        option.value = '-1';
        fragment.appendChild(option);
    }
    item_list.forEach((item, i)=>{
        const option = document.createElement('option');
        option.innerHTML = item.name;
        option.value = item.id;
        fragment.appendChild(option);
    });
    DOM_delete_allChildren(select);
    select.appendChild(fragment);
}

window.addEventListener('error', (event) => {
    alert(event.message);
});

document.addEventListener('DOMContentLoaded', () => {

    // カードセレクトを挿入
    const element_main_card_box = document.getElementById('main-character-cards-box');
    const element_sub_card_box  = document.getElementById('sub-character-card-box');
    
    const element_main_cards = DOM_set_characterCards(element_main_card_box, 6, 'main');
    const element_sub_cards  = DOM_set_characterCards(element_sub_card_box, 6, 'sub');

    const element_pItem_box  = document.getElementById('main-character-pItem-box');
    const element_pItems = DOM_set_characterCards(element_pItem_box, 4, 'pItem');



    const element_card_selects = Array.from(document.querySelectorAll('.character-cards select'));
    const element_card_select_checkboxs = Array.from(document.querySelectorAll('.character-cards .checkbox'));

    element_card_selects.forEach(element=>{
        element.addEventListener('change', (e)=>{
            const id = String(e.target.value);
            const rarity = Number(id[0]);
            e.target.parentNode.dataset.rarity = rarity;
        });
    });
    [].concat(element_card_selects, element_card_select_checkboxs).forEach(element=>{
        element.addEventListener('change', (e)=>{
            const elems = Array.from(e.target.parentNode.parentNode.parentNode.children);
            const totalCost = elems.reduce((acc, crt) => {
                const cardId = Number(crt.getElementsByClassName('select-box')[0].value)+(crt.getElementsByClassName('checkbox')[0].checked ? 1 : 0);
                const cost = (cardId < 1 ? 0 : (SkillCardData.getById(cardId).card_cost ?? 0));
                return acc + cost;
            }, 0);
            e.target.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('cost-display')[0].textContent = totalCost;
        })
    });



    function DOM_set_select_contest_pItem (id) {
        const element_select = element_pItems[0];
        const [contestId, stageId] = String(id).split(':'); 
        const pItemId = ContestData.getById(contestId).stages[stageId].stagePItemIds[0];
        const item = PItemData.getById(pItemId);
        DOM_set_select_options(element_select, [item], false);
    }

    function DOM_set_select_unique_pItem (id) {
        const element_select = element_pItems[1];
        const pItemId = PIdolData.getById(id).unique_pIted_id;
        const item = PItemData.getById(pItemId);
        DOM_set_select_options(element_select, [item], false);
    }

    function DOM_set_select_normal_pItem () {
        const element_selects = element_pItems.slice(2);
        const list = PItemData.getAll().filter(item=>
            String(item.id)[0] == '3' && // サポートのPアイテム
            item.id % 10 == 0 && // 未強化
            item.effects
        );
        element_selects.forEach(element=>DOM_set_select_options(element, list, true));
    }
    DOM_set_select_normal_pItem();

    function DOM_set_uniqueSkillCard (type, id) {
        const element_select = (type == 'main') ? element_main_cards[0] : element_sub_cards[0];
        const uniqueSkill = SkillCardData.getById(id);
        DOM_set_select_options(element_select, [uniqueSkill], false);
        element_select.dispatchEvent(new Event('change'));
    }

    function DOM_set_otherSkillCards (plan) {
        const elements = element_main_cards.slice(1).concat(element_sub_cards.slice(1));
        const skillCards = SkillCardData.getAll().filter(item=>
            (item.plan=='free'||item.plan==plan) && // プラン指定
            item.id % 10 == 0 && // 未強化指定
            item.id>2000000 && // 基本カード削除
            String(item.id)[1] != '2' // キャラ固有削除
        );
        elements.forEach(element=>{
            DOM_set_select_options(element, skillCards, true);
            element.dispatchEvent(new Event('change'));
        });
    }

    let current_stage_plan = "";
    let current_main_plan = "";

    // キャラが選択されたらカードセレクトに項目挿入
    const element_main_character_select = document.getElementById('main-character');
    const element_sub_character_select  = document.getElementById('sub-character');

    element_main_character_select.addEventListener('change', (e) => {
        const id = Number(e.target.value);
        const pIdol = PIdolData.getById(id);
        DOM_delete_allChildren(element_sub_character_select);
        if (!pIdol) {
            element_sub_character_select.disabled = true;
            return;
        }
        element_sub_character_select.disabled = false;
        const dPIdols = PIdolData.getByCharacterId(pIdol.character_id).filter(idol=>idol.plan==pIdol.plan);
        DOM_set_character(element_sub_character_select, dPIdols);
        DOM_set_uniqueSkillCard('main', pIdol.unique_skillCard_id);

        // プランが変わったらカード選択を更新
        if (current_main_plan != pIdol.plan) {
            current_main_plan = pIdol.plan;
            DOM_set_otherSkillCards(current_main_plan);
        }

        DOM_set_select_unique_pItem(id);

        element_sub_character_select.dispatchEvent(new Event('change'));
    }, false);

    element_sub_character_select.addEventListener('change', (e) => {
        const id = Number(e.target.value);
        const pIdol = PIdolData.getById(id);
        DOM_set_uniqueSkillCard('sub', pIdol.unique_skillCard_id);
    }, false);

    // コンテスト一覧
    const element_contest_select = document.getElementById('contest-select');
    const element_contest_stage_select = document.getElementById('contest-stage-select');
    DOM_set_contest(element_contest_select);
    element_contest_select.options[element_contest_select.options.length-1].selected = true;

    // コンテストの種類を入力したときのイベント
    element_contest_select.addEventListener('change', (e) => {
        const id = Number(e.target.value);
        const contestDetail = ContestData.getById(id);

        const fragment = document.createDocumentFragment();
        contestDetail.stages.forEach((item, i)=>{
            const option = document.createElement('option');
            const translate_plan = { 'free': 'フリー', 'sense': 'センス', 'logic': 'ロジック' };
            option.innerHTML = `${item.name}(${item.turn}T/${translate_plan[item.plan]})`;
            option.value = `${id}:${i}`;
            fragment.appendChild(option);
        });
        DOM_delete_allChildren(element_contest_stage_select);
        element_contest_stage_select.appendChild(fragment);
        element_contest_stage_select.dispatchEvent(new Event('change'));
    });

    // コンテストのステージを入力したときのイベント
    element_contest_stage_select.addEventListener('change', (e) => {
        const [id, idx] = e.target.value.split(':').map(value=>Number(value));
        const plan = ContestData.getById(id).stages[idx].plan;
        if (current_stage_plan != plan) {
            current_stage_plan = plan;
            // メインキャラクター設定
            DOM_set_character(element_main_character_select, PIdolData.getAll().filter(idol=>(plan=='free') ? true : plan==idol.plan));
            element_sub_character_select.disabled = true;
            element_main_character_select.dispatchEvent(new Event('change'));
        }
        DOM_set_select_contest_pItem(e.target.value);
    });

    function loadOptionsFromSearchParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const contestStage = urlParams.get("contest_stage");
        const pIdol = urlParams.get("p_idol");
        const status = urlParams.get("status");
        const pItems = urlParams.get("p_items");
        const cards = urlParams.get("cards");

        if (contestStage) {
            const contestId = contestStage.split(":")[0];
            element_contest_select.value = contestId;
            element_contest_select.dispatchEvent(new Event("change"));
            element_contest_stage_select.value = contestStage;
            element_contest_stage_select.dispatchEvent(new Event("change"));
        }
        if (pIdol) {
            const [mainIdolId, subIdolId] = pIdol.split(":");
            element_main_character_select.value = mainIdolId;
            element_main_character_select.dispatchEvent(new Event("change"));
            element_sub_character_select.value = subIdolId;
            element_sub_character_select.dispatchEvent(new Event("change"));
        }
        if (status) {
            const [vocal, dance, visual, hp] = status.split(":");
            document.getElementById("status-vocal").value = vocal;
            document.getElementById("status-dance").value = dance;
            document.getElementById("status-visual").value = visual;
            document.getElementById("status-hp").value = hp;
        }
        if (pItems) {
            const itemIds = pItems.split(":");
            element_pItems.slice(2).forEach((elem, idx) => (elem.value = itemIds[idx]));
        }
        if (cards) {
            const cardIds = cards.split("_").map((cardGroup) => cardGroup.split(":"));
            element_main_cards.forEach((elem, idx) => {
            elem.value = 2 * Math.floor(cardIds[0][idx] / 2);
            elem.parentNode.getElementsByClassName("checkbox")[0].checked =
                cardIds[0][idx] % 2 > 0;
            elem.dispatchEvent(new Event("change"));
            });
            element_sub_cards.forEach((elem, idx) => {
            elem.value = 2 * Math.floor(cardIds[1][idx] / 2);
            elem.parentNode.getElementsByClassName("checkbox")[0].checked =
                cardIds[1][idx] % 2 > 0;
            elem.dispatchEvent(new Event("change"));
            });
        }
    }

    function saveOptiostoSearchParams() {
        
    }

    element_contest_select.dispatchEvent(new Event('change'));


    loadOptionsFromSearchParams();


    // グラフの準備
    const canvas = document.getElementById('chart');
    const chart = new Chart(canvas, {
        type: "bar",
    });

    // ログボタン
    const element_contest_result_buttons = document.querySelectorAll('.result-log-button>input[name="result-log-button"]');
    const element_contest_result_logs = document.querySelectorAll('#contest-log>div');
    element_contest_result_buttons.forEach((radio, i) => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                element_contest_result_logs.forEach((log, j) => {
                    if (i == j) {
                        log.classList.remove('hide');
                    } else {
                        log.classList.add('hide');
                    }
                });
            }
        });
    });
    element_contest_result_buttons[0].click();

    // 実行
    let run_flag = false;
    const element_run_button = document.getElementById('run-button');
    element_run_button.addEventListener('click', () => {
        if (run_flag) {
            alert('実行中です。');
            return;
        }
        run_flag = true;
        const vocal  = Number(document.getElementById('status-vocal').value);
        const dance  = Number(document.getElementById('status-dance').value);
        const visual = Number(document.getElementById('status-visual').value);
        const hp     = Number(document.getElementById('status-hp').value);
        // Pアイテム
        const pItemIds_tmp = element_pItems.map(element=>Number(element.value)).filter(id=>id!=-1);
        if (
            element_pItems[1].parentNode.getElementsByClassName('checkbox')[0].checked && 
            pItemIds_tmp[1] % 10 == 0
        ) {
            pItemIds_tmp[1]+=1;
        }
        const pItemIds = Array.from(new Set(pItemIds_tmp));

        // カード
        const main_cards_id = element_main_cards.map(element=>Number(element.value)+(element.parentNode.getElementsByClassName('checkbox')[0].checked && element.value % 10 == 0 ? 1 : 0));
        const sub_cards_id = element_sub_cards.map(element=>Number(element.value)+(element.parentNode.getElementsByClassName('checkbox')[0].checked && element.value % 10 == 0 ? 1 : 0));
        const skillCardIds = main_cards_id.concat(sub_cards_id).filter(id=>id&&id!='-1');
        // 重複を削除する機構がないため、仮削除
        if (element_main_cards[0].value == element_sub_cards[0].value) {
            let delete_number = skillCardIds.lastIndexOf(Number(element_main_cards[0].value));
            if (delete_number == -1) {
                delete_number = skillCardIds.lastIndexOf(Number(element_main_cards[0].value)+1);
            }
            skillCardIds.splice(delete_number, 1);
        }

        // デフォルトデッキ
        const main_character_id = element_main_character_select.value;
        const pIdol = PIdolData.getById(main_character_id);
        let default_skillCardIds = [];
        switch (pIdol.plan) {
            case 'sense':
                default_skillCardIds = [1010010, 1010010, 1011010, 1011020, 1021010, 1021010, 1021020, 1021020];
                break;
            case 'logic':
                default_skillCardIds = [1012010, 1012020, 1020010, 1020010, 1022010, 1022010, 1022020, 1022020];
                break;
        }

        skillCardIds.push(...default_skillCardIds);

        // コンテスト
        const [contestId, stageId] = element_contest_stage_select.value.split(':');
        const contestDetail = ContestData.getById(contestId);
        const contestStage  = contestDetail.stages[stageId];

        const simulateCount = 2000;

        const autoId = document.getElementById('contest-auto').value;
        const run_data = {
            turn: contestStage.turn,
            criteria: contestDetail.criteria,
            turnTypes: contestStage.turnTypes,
            parameter: {
                vocal : vocal,
                dance : dance,
                visual: visual,
                hp: hp,
            },
            plan: current_main_plan,
            pItemIds: pItemIds,

            skillCardIds: skillCardIds, 
            autoId: autoId,

            count: simulateCount,
        };

        let scoreList, minLog, rndLog, maxLog;
        
        const result = run(run_data);
        scoreList = result.scoreList;
        minLog = result.minLog;
        rndLog = result.rndLog;
        maxLog = result.maxLog;

        scoreList.sort((a, b) => a - b);
        document.getElementById('contest-log-min').innerHTML = minLog.text.replaceAll('\n', '<br>');
        document.getElementById('contest-log-rnd').innerHTML = rndLog.text.replaceAll('\n', '<br>');
        document.getElementById('contest-log-max').innerHTML = maxLog.text.replaceAll('\n', '<br>');

        const aryMax = function (a, b) {return Math.max(a, b);}
        const aryMin = function (a, b) {return Math.min(a, b);}
        
        const minscore = Math.floor(scoreList.reduce(aryMin)/1000);
        const maxscore = Math.floor(scoreList.reduce(aryMax)/1000);
        const count = Math.floor((maxscore - minscore))+1;
        const data = new Array(count).fill(0);
        for (let i = 0; i < scoreList.length; i++) {
            const kaikyu = Math.floor(scoreList[i]/1000) - minscore;
            data[kaikyu]++;
        }

        document.getElementById('result-score-mean').textContent = Math.floor(scoreList.reduce((pre, crt)=>pre+crt, 0)/scoreList.length);
        document.getElementById('result-score-median').textContent = scoreList[Math.floor(scoreList.length/2)];
        document.getElementById('result-score-mode').textContent = (minscore + data.reduce((pre, crt, i)=>pre[0]<crt?[crt, i]:pre, [-1, 0])[1])*1000;

        chart.data = {
            labels:  new Array(count).fill(0).map((_,i)=>(i+minscore)*1000),
            datasets: [
                {
                    label: `スコア（N=${simulateCount}）`,
                    data: data
                }
            ]
        };
        chart.update();
        
        run_flag = false;
    }, false);

}, false);