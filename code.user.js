// ==UserScript==
// @name         MWI角色名片插件
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  MWI角色名片插件 - 一键生成角色名片
// @author       Windoge
// @match        https://www.milkywayidle.com/*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/gxy12345/mwi-character-card/refs/heads/main/code.user.js
// @updateURL    https://raw.githubusercontent.com/gxy12345/mwi-character-card/refs/heads/main/code.user.js
// ==/UserScript==

(function() {
    'use strict';

    const isZH = navigator.language.includes('zh');
    
    // 简化的SVG创建工具
    class CharacterCardSVGTool {
        constructor() {
            this.isLoaded = true; // 简化：直接设为true
            this.spriteSheets = {
                items: '/static/media/items_sprite.6d12eb9d.svg',
                skills: '/static/media/skills_sprite.57eb3a30.svg',
                abilities: '/static/media/abilities_sprite.38932ac3.svg'
            };
        }

        async loadSpriteSheets() {
            console.log('SVG sprite系统已初始化');
            console.log('Sprite文件路径:', this.spriteSheets);
            this.isLoaded = true;
            return true;
        }

        // 创建MWI风格的SVG图标 - 直接返回HTML字符串
        createSVGIcon(itemId, options = {}) {
            const { className = 'Icon_icon__2LtL_', title = itemId, type = 'items' } = options;
            const svgHref = `${this.spriteSheets[type]}#${itemId}`;
            
            // 收集调试信息
            if (!debugInfo.firstSvgPath) {
                debugInfo.firstSvgPath = svgHref;
            }
            debugInfo.iconCount++;
            
            return `<svg role="img" aria-label="${title}" class="${className}" width="100%" height="100%">
                <use href="${svgHref}"></use>
            </svg>`;
        }

        // 后备图标
        createFallbackIcon(itemId, className, title) {
            const text = itemId.length > 6 ? itemId.substring(0, 6) : itemId;
            return `<div class="${className}" title="${title}" style="
                width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
                background: #4a90e2; color: white; font-size: 10px; border-radius: 4px;
            ">${text}</div>`;
        }

        hasIcon() { return this.isLoaded; }
    }

    let svgTool = new CharacterCardSVGTool();
    let debugInfo = {
        firstSvgPath: null,
        iconCount: 0
    };

    // 简化的SVG图标创建函数
    function createSvgIcon(itemHrid, iconType = null, className = 'Icon_icon__2LtL_') {
        // 自动检测图标类型和提取itemId
        let type = 'items';
        let itemId = itemHrid;
        
        if (itemHrid.startsWith('/items/')) {
            type = 'items';
            itemId = itemHrid.replace('/items/', '');
        } else if (itemHrid.startsWith('/abilities/')) {
            type = 'abilities';
            itemId = itemHrid.replace('/abilities/', '');
        } else if (itemHrid.startsWith('/skills/')) {
            type = 'skills';
            itemId = itemHrid.replace('/skills/', '');
        } else {
            // 对于基础属性图标
            if (['stamina', 'intelligence', 'attack', 'power', 'defense', 'ranged', 'magic'].includes(itemHrid)) {
                type = 'skills';
                itemId = itemHrid;
            } else {
                itemId = itemHrid.replace("/items/", "").replace("/abilities/", "").replace("/skills/", "");
            }
        }
        
        // 如果手动指定了类型，使用指定的类型
        if (iconType) {
            type = iconType;
        }
        
        // 使用SVG工具创建图标
        if (svgTool && svgTool.isLoaded) {
            return svgTool.createSVGIcon(itemId, { 
                className: className, 
                title: itemId,
                type: type
            });
        }
        
        // 后备方案
        return svgTool.createFallbackIcon(itemId, className, itemId);
    }

    function generateEquipmentPanel(characterObj) {
        // MWI装备槽位映射 - 使用grid位置
        const equipmentSlots = {
            "/item_locations/back": { row: 1, col: 1, name: "背部" },
            "/item_locations/head": { row: 1, col: 2, name: "头部" },
            "/item_locations/main_hand": { row: 2, col: 1, name: "主手" },
            "/item_locations/body": { row: 2, col: 2, name: "身体" },
            "/item_locations/off_hand": { row: 2, col: 3, name: "副手" },
            "/item_locations/hands": { row: 3, col: 1, name: "手部" },
            "/item_locations/legs": { row: 3, col: 2, name: "腿部" },
            "/item_locations/pouch": { row: 3, col: 3, name: "口袋" },
            "/item_locations/feet": { row: 4, col: 2, name: "脚部" },
            "/item_locations/neck": { row: 1, col: 5, name: "项链" },
            "/item_locations/earrings": { row: 2, col: 5, name: "耳环" },
            "/item_locations/ring": { row: 3, col: 5, name: "戒指" },
            "/item_locations/trinket": { row: 4, col: 5, name: "饰品" },
            "/item_locations/two_hand": { row: 2, col: 1, name: "双手" }
        };

        let items = characterObj.equipment || characterObj.characterItems || [];
        const equipmentMap = {};
        let hasTwoHandWeapon = false;

        // 构建装备映射
        items.forEach(item => {
            const slotInfo = equipmentSlots[item.itemLocationHrid];
            if (slotInfo) {
                equipmentMap[item.itemLocationHrid] = item;
                if (item.itemLocationHrid === "/item_locations/two_hand") hasTwoHandWeapon = true;
            }
        });

        // 创建MWI风格的装备面板
        let html = '<div class="equipment-panel">';
        html += `<div class="panel-title">${isZH ? '装备' : 'Equipment'}</div>`;
        html += '<div class="EquipmentPanel_playerModel__3LRB6">';
        
        // 遍历所有装备槽位
        Object.entries(equipmentSlots).forEach(([slotHrid, slotInfo]) => {
            // 如果有双手武器，跳过副手槽
            if (hasTwoHandWeapon && slotHrid === "/item_locations/off_hand") {
                return;
            }
            
            const item = equipmentMap[slotHrid];
            
            html += `<div style="grid-row-start: ${slotInfo.row}; grid-column-start: ${slotInfo.col};">`;
            html += '<div class="ItemSelector_itemSelector__2eTV6">';
            html += '<div class="ItemSelector_itemContainer__3olqe">';
            html += '<div class="Item_itemContainer__x7kH1">';
            html += '<div>';
            
            if (item) {
                // 有装备的槽位
                const itemName = item.itemHrid.replace('/items/', '');
                const enhancementLevel = item.enhancementLevel || 0;
                
                html += '<div class="Item_item__2De2O Item_clickable__3viV6" style="position: relative;">';
                html += '<div class="Item_iconContainer__5z7j4">';
                html += createSvgIcon(item.itemHrid, 'items'); // 使用MWI的Icon类
                html += '</div>';
                
                // 强化等级 - 完全按照MWI原生格式
                if (enhancementLevel > 0) {
                    html += `<div class="Item_enhancementLevel__19g-e enhancementProcessed enhancementLevel_${enhancementLevel}">+${enhancementLevel}</div>`;
                }
                
                html += '</div>';
            } else {
                // 空装备槽
                html += '<div class="Item_item__2De2O" style="position: relative; opacity: 0.3;">';
                html += '<div class="Item_iconContainer__5z7j4">';
                html += `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 10px;">${isZH ? '空' : 'Empty'}</div>`;
                html += '</div>';
                html += '</div>';
            }
            
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>'; // EquipmentPanel_playerModel__3LRB6
        html += '</div>'; // equipment-panel
        
        return html;
    }

    function generateAbilityPanel(characterObj) {
        const abilityMapping = [
            { key: "staminaLevel", name: isZH ? "耐力" : "Stamina", icon: "stamina" },
            { key: "intelligenceLevel", name: isZH ? "智力" : "Intelligence", icon: "intelligence" },
            { key: "attackLevel", name: isZH ? "攻击" : "Attack", icon: "attack" },
            { key: "powerLevel", name: isZH ? "力量" : "Power", icon: "power" },
            { key: "defenseLevel", name: isZH ? "防御" : "Defense", icon: "defense" },
            { key: "rangedLevel", name: isZH ? "远程" : "Ranged", icon: "ranged" },
            { key: "magicLevel", name: isZH ? "魔法" : "Magic", icon: "magic" }
        ];

        let html = '<div class="ability-panel">';
        html += `<div class="panel-title">${isZH ? '属性等级' : 'Abilities'}</div><div class="ability-list">`;
        
        abilityMapping.forEach(ability => {
            let level = 0;
            if (characterObj[ability.key]) {
                level = characterObj[ability.key];
            } else if (characterObj.characterSkills) {
                const skillKey = ability.key.replace('Level', '');
                const skill = characterObj.characterSkills.find(skill => skill.skillHrid.includes(`/skills/${skillKey}`));
                level = skill ? skill.level : 0;
            }
            
            html += `<div class="ability-row">
                <div class="ability-icon">${createSvgIcon(ability.icon, 'skills')}</div>
                <span style="flex: 1;">${ability.name}</span>
                <span class="level">Lv.${level}</span>
            </div>`;
        });
        
        return html + '</div></div>';
    }

    function generateSkillPanel(data) {
        let abilities = data.abilities || data.characterSkills || [];
        
        // 获取所有技能能力（过滤掉战斗技能以外的）
        const combatSkills = abilities
            .filter(ability => ability.abilityHrid && ability.abilityHrid.startsWith("/abilities/"))
            .sort((a, b) => b.level - a.level); // 按等级降序排列

        let html = '<div class="skill-panel">';
        html += `<div class="panel-title">${isZH ? '技能等级' : 'Skills'}</div>`;
        
        // 使用MWI原生的技能网格容器
        html += '<div class="AbilitiesPanel_abilityGrid__-p-VF">';
        
        // 渲染每个技能
        combatSkills.forEach(ability => {
            const abilityId = ability.abilityHrid.replace('/abilities/', '');
            
            html += '<div>';
            html += '<div class="Ability_ability__1njrh Ability_clickable__w9HcM">';
            html += '<div class="Ability_iconContainer__3syNQ">';
            html += createSvgIcon(ability.abilityHrid, 'abilities'); // 使用完整的hrid
            html += '</div>';
            html += `<div class="Ability_level__1L-do">Lv.${ability.level}</div>`;
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>'; // AbilitiesPanel_abilityGrid__-p-VF
        html += '</div>'; // skill-panel
        
        return html;
    }

    function generateHousePanel(data) {
        const houseRoomsMapping = [
            { hrid: "/house_rooms/dining_room", icon: "stamina", name: isZH ? "餐厅" : "Dining Room" },
            { hrid: "/house_rooms/library", icon: "intelligence", name: isZH ? "图书馆" : "Library" },
            { hrid: "/house_rooms/dojo", icon: "attack", name: isZH ? "道场" : "Dojo" },
            { hrid: "/house_rooms/gym", icon: "power", name: isZH ? "健身房" : "Gym" },
            { hrid: "/house_rooms/armory", icon: "defense", name: isZH ? "军械库" : "Armory" },
            { hrid: "/house_rooms/archery_range", icon: "ranged", name: isZH ? "射箭场" : "Archery Range" },
            { hrid: "/house_rooms/mystical_study", icon: "magic", name: isZH ? "神秘研究室" : "Mystical Study" }
        ];

        let houseRoomMap = data.houseRooms || data.characterHouseRoomMap || {};

        let html = '<div class="house-panel">';
        html += `<div class="panel-title">${isZH ? '房屋等级' : 'House Rooms'}</div>`;
        
        // 使用和技能面板相同的MWI原生结构
        html += '<div class="AbilitiesPanel_abilityGrid__-p-VF">';
        
        // 遍历所有房屋类型
        houseRoomsMapping.forEach(houseRoom => {
            let level = 0;
            if (houseRoomMap[houseRoom.hrid]) {
                level = typeof houseRoomMap[houseRoom.hrid] === 'object' 
                    ? houseRoomMap[houseRoom.hrid].level || 0 
                    : houseRoomMap[houseRoom.hrid];
            }
            
            // 使用和技能相同的MWI原生结构
            html += '<div>';
            html += '<div class="Ability_ability__1njrh Ability_clickable__w9HcM">';
            html += '<div class="Ability_iconContainer__3syNQ">';
            html += createSvgIcon(houseRoom.icon, 'skills'); // 使用标准的Icon类
            html += '</div>';
            // 为8级房屋添加特殊显示
            let levelText = '';
            let levelClass = 'Ability_level__1L-do';
            
            if (level === 8) {
                levelText = `Lv.8`;
                levelClass += ' house-max-level';
            } else if (level > 0) {
                levelText = `Lv.${level}`;
            } else {
                levelText = isZH ? '未建造' : 'Lv.0';
            }
            
            html += `<div class="${levelClass}">${levelText}</div>`;
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>'; // AbilitiesPanel_abilityGrid__-p-VF
        html += '</div>'; // house-panel
        
        return html;
    }

    function generateCharacterCard(data, characterName, characterNameElement = null) {
        let characterObj = data.player || data;
        const equipmentPanel = generateEquipmentPanel(characterObj);
        
        // 创建标题栏内容
        let headerContent = '';
        if (characterNameElement) {
            // 使用从页面复制的角色信息元素
            headerContent = characterNameElement;
        } else {
            // 后备方案：使用简单的角色名
            headerContent = `<h2>${characterName}</h2>`;
        }
        
        return `
            <div id="character-card" class="character-card">
                <div class="card-header">${headerContent}</div>
                <div class="card-content">
                    ${equipmentPanel}
                    ${generateAbilityPanel(characterObj)}
                    ${generateSkillPanel(data)}
                    ${generateHousePanel(data)}
                </div>
            </div>
        `;
    }

    function createModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .character-card-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.8); z-index: 10000; display: flex;
                justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;
            }
            .modal-content {
                background: white; border-radius: 15px; padding: 20px;
                max-width: 90vw; max-height: 90vh; overflow: auto; position: relative;
            }
            .close-modal {
                position: absolute; top: 10px; right: 15px; background: none;
                border: none; font-size: 24px; cursor: pointer; color: #666; z-index: 1;
            }
            .close-modal:hover { color: #000; }
            .character-card {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border: 2px solid #4a90e2; border-radius: 15px; padding: 20px; color: white;
                font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .card-header {
                text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4a90e2; padding-bottom: 10px;
            }
            .card-header h2 {
                margin: 0; color: #4a90e2; font-size: 24px; text-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
            }
            
            /* 角色信息元素在名片中的样式 */
            .card-header .CharacterName_characterName__2FqyZ {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .card-header .CharacterName_chatIcon__22lxV {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .card-header .CharacterName_name__1amXp {
                font-size: 20px;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
            }
            
            .card-header .CharacterName_gameMode__2Pvw8 {
                font-size: 14px;
                opacity: 0.8;
            }
            .card-content {
                display: grid; grid-template-columns: 1fr 0.7fr; grid-template-rows: auto 1fr; gap: 20px;
            }
            .equipment-panel, .house-panel, .ability-panel, .skill-panel {
                background: rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 15px;
                border: 1px solid rgba(74, 144, 226, 0.3);
            }
            .panel-title {
                margin: 0 0 15px 0; color: #4a90e2; font-size: 16px;
                border-bottom: 1px solid rgba(74, 144, 226, 0.3); padding-bottom: 5px; text-align: center;
            }
            .equipment-panel { grid-column: 1; grid-row: 1; }
            
            /* 只为模态框内的装备面板添加网格布局，不影响游戏原生UI */
            .character-card .EquipmentPanel_playerModel__3LRB6 {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                grid-template-rows: repeat(4, auto);
                gap: 8px;
                padding: 10px;
                max-width: 350px;
                margin: 0 auto;
            }
            
            /* 确保装备槽的基本布局 */
            .character-card .ItemSelector_itemSelector__2eTV6 {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 60px;
            }
            
            /* 技能面板样式 - 仅作用于角色名片内 */
            .character-card .AbilitiesPanel_abilityGrid__-p-VF {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
                gap: 8px;
                padding: 10px;
                max-height: 200px;
                overflow-y: auto;
            }
            
            /* 技能项容器 */
            .character-card .Ability_ability__1njrh {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 70px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(74, 144, 226, 0.3);
                transition: all 0.2s ease;
            }
            
            .character-card .Ability_ability__1njrh.Ability_clickable__w9HcM:hover {
                background: rgba(74, 144, 226, 0.1);
                border-color: #4a90e2;
                transform: scale(1.05);
            }
            
            /* 技能图标容器 */
            .character-card .Ability_iconContainer__3syNQ {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 4px;
            }
            
            /* 技能等级文字 */
            .character-card .Ability_level__1L-do {
                font-size: 12px;
                font-weight: bold;
                color: #fff;
                text-align: center;
            }
            
            /* 房屋最高等级特殊样式 */
            .character-card .house-max-level {
                color: #ff8c00 !important;
                font-weight: bold;
                text-shadow: 0 0 4px rgba(255, 140, 0, 0.5);
            }
            .ability-panel { grid-column: 2; grid-row: 1; }
            .ability-list { flex: 1; }
            .ability-row {
                display: flex; align-items: center; margin-bottom: 8px; padding: 4px; border-radius: 4px;
            }
            .ability-icon {
                width: 30px; height: 30px; margin-right: 10px; display: flex;
                align-items: center; justify-content: center;
            }
            .house-panel { 
                grid-column: 1; 
                grid-row: 2; 
            }
            

            .skill-panel { 
                grid-column: 2; 
                grid-row: 2; 
            }
            .level { color: #fff; font-weight: bold; }
            @media (max-width: 768px) {
                .card-content { grid-template-columns: 1fr; grid-template-rows: auto auto auto auto; }
                .equipment-panel { grid-column: 1; grid-row: 1; }
                .ability-panel { grid-column: 1; grid-row: 2; }
                .house-panel { grid-column: 1; grid-row: 3; }
                .skill-panel { grid-column: 1; grid-row: 4; }
            }
            
            .instruction-banner {
                background: #17a2b8; color: white; padding: 10px; border-radius: 5px;
                margin-bottom: 10px; font-weight: bold; text-align: center;
            }
            
            /* 仅为角色名片内的SVG图标添加优化，不影响游戏原生UI */
            .character-card .Icon_icon__2LtL_ {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 0 2px rgba(0,0,0,0.3));
                image-rendering: -webkit-optimize-contrast;
                image-rendering: -moz-crisp-edges;
                image-rendering: pixelated;
            }
        `;
        document.head.appendChild(style);
    }

    async function readClipboardData() {
        try {
            const text = await navigator.clipboard.readText();
            return text;
        } catch (error) {
            console.log('无法读取剪贴板:', error);
            return null;
        }
    }

    function isValidCharacterData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // 检查新格式 (player对象)
        if (data.player && (
            data.player.equipment || 
            data.player.characterItems || 
            data.player.staminaLevel !== undefined ||
            data.player.name
        )) {
            return true;
        }
        
        // 检查旧格式
        if (data.character && (data.characterSkills || data.characterItems)) {
            return true;
        }
        
        // 检查是否直接包含关键字段
        if (data.equipment || data.characterItems || data.characterSkills) {
            return true;
        }
        
        // 检查是否包含技能等级字段
        if (data.staminaLevel !== undefined || data.intelligenceLevel !== undefined || 
            data.attackLevel !== undefined || data.powerLevel !== undefined) {
            return true;
        }
        
        // 检查是否包含房屋数据
        if (data.houseRooms || data.characterHouseRoomMap) {
            return true;
        }
        
        // 检查是否包含能力数据
        if (data.abilities && Array.isArray(data.abilities)) {
            return true;
        }
        
        return false;
    }

    async function showCharacterCard() {
        try {
            console.log('尝试读取剪贴板数据...');
            const clipboardText = await readClipboardData();
            
            if (!clipboardText) {
                alert(isZH ? 
                    '无法读取剪贴板数据\n\n请确保：\n1. 已点击"导出人物到剪贴板"按钮\n2. 允许浏览器访问剪贴板\n3. 剪贴板中有有效的角色数据' : 
                    'Cannot read clipboard data\n\nPlease ensure:\n1. Clicked "Export to clipboard" button\n2. Allow browser to access clipboard\n3. Valid character data in clipboard');
                return;
            }
            
            console.log('剪贴板数据长度:', clipboardText.length);
            
            let characterData;
            try {
                characterData = JSON.parse(clipboardText);
            } catch (error) {
                alert(isZH ? 
                    '剪贴板中的数据不是有效的JSON格式\n\n请确保先点击"导出人物到剪贴板"按钮' : 
                    'Data in clipboard is not valid JSON\n\nPlease ensure you clicked "Export to clipboard" button first');
                return;
            }
            
            if (!isValidCharacterData(characterData)) {
                alert(isZH ? 
                    '剪贴板中的数据不包含有效的角色信息\n\n请确保使用MWI Tools的"导出人物到剪贴板"功能' : 
                    'Data in clipboard does not contain valid character information\n\nPlease ensure you use MWI Tools "Export to clipboard" feature');
                return;
            }
            
            console.log('检测到有效的角色数据:', characterData);
            console.log('SVG图标加载状态:', svgTool.isLoaded ? '已加载' : '未加载');
            
            // 重置调试信息
            debugInfo.firstSvgPath = null;
            debugInfo.iconCount = 0;
            
            const characterName = characterData.player?.name || characterData.character?.name || (isZH ? '角色' : 'Character');
            
            // 查找页面中的角色信息元素 - 获取最后一个
            let characterNameElement = null;
            const characterNameDivs = document.querySelectorAll('.CharacterName_characterName__2FqyZ');
            if (characterNameDivs.length > 0) {
                // 取最后一个元素
                const lastCharacterNameDiv = characterNameDivs[characterNameDivs.length - 1];
                characterNameElement = lastCharacterNameDiv.outerHTML;
                console.log(`找到${characterNameDivs.length}个角色信息元素，使用最后一个（第${characterNameDivs.length}个）`);
            } else {
                console.log('未找到角色信息元素，将使用后备显示方式');
            }
            
            const modal = document.createElement('div');
            modal.className = 'character-card-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="close-modal">&times;</button>
                    <div class="instruction-banner">
                        ${isZH ? 
                            `MWI角色名片插件 v1.0` : 
                            `MWI Character Card Plugin v1.0`
                        }
                    </div>
                    ${generateCharacterCard(characterData, characterName, characterNameElement)}
                </div>
            `;

            modal.querySelector('.close-modal').onclick = () => document.body.removeChild(modal);
            modal.onclick = (e) => { if (e.target === modal) document.body.removeChild(modal); };
            document.body.appendChild(modal);
            
        } catch (error) {
            console.error('生成角色名片失败:', error);
            alert(isZH ? 
                '生成角色名片时发生错误\n\n错误信息: ' + error.message : 
                'Error occurred while generating character card\n\nError: ' + error.message);
        }
    }

    function addCharacterCardButton() {
        const checkElem = () => {
            const selectedElement = document.querySelector(`div.SharableProfile_overviewTab__W4dCV`);
            if (selectedElement) {
                clearInterval(timer);
                if (selectedElement.querySelector('.character-card-btn')) return;

                const button = document.createElement("button");
                button.className = 'character-card-btn';
                button.textContent = isZH ? "📋 查看角色名片" : "📋 View Character Card";
                button.style.cssText = `
                    border-radius: 6px; height: 32px; background-color: #17a2b8; color: white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 0px; margin: 10px auto; 
                    display: inline-block; padding: 0 16px; min-width: 140px; max-width: 180px;
                    font-size: 13px; cursor: pointer; transition: all 0.2s ease;
                `;
                
                // 添加hover效果
                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = '#138496';
                    button.style.transform = 'translateY(-1px)';
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.backgroundColor = '#17a2b8';
                    button.style.transform = 'translateY(0)';
                });
                
                button.onclick = () => { 
                    showCharacterCard(); 
                    return false; 
                };
                
                // 创建按钮容器并居中
                const buttonContainer = document.createElement('div');
                buttonContainer.style.cssText = 'text-align: center; margin-top: 10px;';
                buttonContainer.appendChild(button);
                
                // 插入按钮容器
                selectedElement.appendChild(buttonContainer);
                
                console.log('角色名片按钮已添加');
                return false;
            }
        };
        let timer = setInterval(checkElem, 200);
    }

    async function init() {
        console.log('MWI角色名片插件 v1.0');
        console.log('使用说明：');
        console.log('1. 点击MWI Tools的"导出人物到剪贴板"按钮');
        console.log('2. 点击下方的"📋 查看角色名片"按钮');
        console.log('3. 系统将自动从剪贴板读取数据生成名片');
        
        createModalStyles();
        const spritesLoaded = await svgTool.loadSpriteSheets();
        console.log(`图标系统初始化${spritesLoaded ? '成功' : '失败'}，将使用${spritesLoaded ? 'MWI原版SVG图标' : '后备图标显示'}`);
        if (spritesLoaded) {
            console.log('SVG Sprite文件:', svgTool.spriteSheets);
        }
        addCharacterCardButton();
        
        const observer = new MutationObserver(() => {
            setTimeout(addCharacterCardButton, 1000);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(); 