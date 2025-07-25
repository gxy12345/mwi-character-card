# MWI Character Card Generator

一个用于生成Milky Way Idle游戏角色名片的网页工具。

## 功能特点

- 🎯 解析MWIT导出的JSON数据
- 🎨 生成美观的角色名片
- 📱 响应式设计，支持移动设备
- 🖼️ 支持下载为PNG图片
- 🎮 显示游戏内真实图标

## 使用方法

1. **打开网页**
   - 在浏览器中打开 `character_card_web.html`

2. **获取角色数据**
   - 在游戏中运行MWIT脚本
   - 点击"导出人物到剪贴板"按钮
   - 复制导出的JSON数据

3. **生成名片**
   - 将JSON数据粘贴到网页的文本框中
   - 点击"解析数据"按钮
   - 查看生成的角色名片预览

4. **下载名片**
   - 点击"下载名片"按钮
   - 名片将自动下载为PNG图片

## 名片内容

角色名片包含以下5个部分：

### 1. 角色名称
显示当前角色的名称

### 2. 装备面板
分为两个子面板：
- **身体装备**：武器、防具、头盔、手套、靴子等
- **首饰装备**：戒指、项链、耳环、饰品等

### 3. 房屋面板
显示7个建筑的等级：
- 射箭场 (Archery Range)
- 军械库 (Armory)
- 道场 (Dojo)
- 健身房 (Gym)
- 图书馆 (Library)
- 神秘研究室 (Mystical Study)
- 餐厅 (Dining Room)

### 4. 能力面板
显示战斗属性等级：
- 智力 (Intelligence)
- 力量 (Power)
- 防御 (Defense)
- 耐力 (Stamina)
- 魔法 (Magic)
- 远程 (Ranged)
- 攻击 (Attack)

### 5. 技能面板
显示非战斗技能等级（按等级排序，显示前12个）

## 文件说明

- `character_card_web.html` - 主网页文件
- `svg_sprite_sheet.html` - 游戏图标库（从Enhancelator.html提取）
- `extract_svg.js` - 用于提取SVG图标的工具脚本

## 技术特点

- 使用原生JavaScript，无需额外依赖
- 集成html2canvas库用于图片导出
- 动态加载SVG图标库
- 响应式CSS设计
- 支持中英文界面

## 注意事项

- 确保`svg_sprite_sheet.html`文件与主网页在同一目录下
- 需要现代浏览器支持（支持ES6+和SVG）
- 图片导出功能需要网络连接（加载html2canvas库）

## 故障排除

如果图标显示不正确：
1. 检查`svg_sprite_sheet.html`文件是否存在
2. 查看浏览器控制台是否有错误信息
3. 确保网页通过HTTP服务器访问（而不是直接打开文件）

如果数据解析失败：
1. 确保JSON格式正确
2. 检查是否包含必要的字段（character、characterSkills、characterItems等）
3. 可以点击"加载示例数据"查看正确的数据格式 