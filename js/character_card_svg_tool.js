/**
 * 名片SVG图标工具
 * 用于在名片生成中使用SVG图标
 */
class CharacterCardSVGTool {
    constructor() {
        this.isLoaded = false;
        this.spriteSheets = {
            items: null,
            skills: null,
            abilities: null
        };
    }

    /**
     * 加载SVG sprite sheets
     * @returns {Promise} 加载完成的Promise
     */
    async loadSpriteSheets() {
        try {
            // 加载物品sprite sheet
            const itemsResponse = await fetch('/assets/sprites/items_sprite.svg');
            if (!itemsResponse.ok) {
                throw new Error(`HTTP error! status: ${itemsResponse.status}`);
            }
            const itemsSpriteText = await itemsResponse.text();
            
            // 加载技能sprite sheet
            const skillsResponse = await fetch('/assets/sprites/skill_sprite.svg');
            if (!skillsResponse.ok) {
                throw new Error(`HTTP error! status: ${skillsResponse.status}`);
            }
            const skillsSpriteText = await skillsResponse.text();

            // 加载能力sprite sheet
            const abilitiesResponse = await fetch('/assets/sprites/abilities_sprite.svg');
            if (!abilitiesResponse.ok) {
                throw new Error(`HTTP error! status: ${abilitiesResponse.status}`);
            }
            const abilitiesSpriteText = await abilitiesResponse.text();
            
            // 将sprite sheets插入到页面中
            const container = document.createElement('div');
            container.style.display = 'none';
            container.innerHTML = itemsSpriteText + skillsSpriteText + abilitiesSpriteText;
            document.body.appendChild(container);
            
            // 保存sprite sheets引用
            const svgs = container.querySelectorAll('svg');
            this.spriteSheets.items = svgs[0];
            this.spriteSheets.skills = svgs[1];
            this.spriteSheets.abilities = svgs[2];
            this.isLoaded = true;
            
            console.log('SVG sprite sheets 加载成功');
            return true;
        } catch (error) {
            console.error('加载SVG sprite sheets失败:', error);
            return false;
        }
    }

    /**
     * 创建SVG图标元素
     * @param {string} itemId - 物品ID
     * @param {Object} options - 选项
     * @returns {HTMLElement|null} SVG元素或null
     */
    createSVGIcon(itemId, options = {}) {
        const {
            size = 32,
            className = 'item-icon',
            title = itemId,
            type = 'items' // 'items' 或 'skills' 或 'abilities'
        } = options;

        if (!this.isLoaded) {
            console.warn('Sprite sheets尚未加载，请先调用 loadSpriteSheets()');
            return null;
        }

        // 查找symbol元素以获取其viewBox
        const spriteSheet = this.spriteSheets[type];
        const symbol = spriteSheet?.querySelector(`#${itemId}`);
        if (!symbol) {
            console.warn(`未找到图标: ${itemId}`);
            return null;
        }

        // 获取symbol的viewBox
        const viewBox = symbol.getAttribute('viewBox') || '0 0 40 40';

        // 创建容器元素
        const container = document.createElement('div');
        container.className = className;
        container.style.cssText = `
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${size}px;
            height: ${size}px;
            vertical-align: middle;
            overflow: visible;
        `;
        container.title = title;

        // 创建SVG和use元素
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', viewBox);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('fill', 'none');
        svg.style.cssText = `
            display: block;
            margin: auto;
            transform: translateX(-0.5px);
        `;

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${itemId}`);

        svg.appendChild(use);
        container.appendChild(svg);

        return container;
    }

    /**
     * 检查图标是否存在
     * @param {string} itemId - 图标ID
     * @param {string} type - 图标类型 ('items' 或 'skills' 或 'abilities')
     * @returns {boolean} 是否存在
     */
    hasIcon(itemId, type = 'items') {
        if (!this.isLoaded || !this.spriteSheets[type]) {
            return false;
        }
        return !!this.spriteSheets[type].querySelector(`#${itemId}`);
    }
}

// 创建全局实例
window.characterCardSVG = CharacterCardSVGTool; 