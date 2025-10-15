/**
 * Button Component
 * Reusable interactive button element
 */

export class Button {
    constructor(scene, x, y, width, height, text, style = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.style = {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#4a90e2',
            borderColor: '#357abd',
            borderWidth: 2,
            borderRadius: 8,
            padding: 12,
            ...style
        };
        
        this.isEnabled = true;
        this.isVisible = true;
        this.isHovered = false;
        this.isPressed = false;
        this.onClick = null;
        this.onHover = null;
        
        this.create();
    }
    
    create() {
        // Create button container
        this.container = this.scene.add.container(this.x, this.y);
        
        // Create background
        this.background = this.scene.add.graphics();
        this.updateBackground();
        
        // Create text
        this.textObject = this.scene.add.text(0, 0, this.text, {
            fontSize: this.style.fontSize,
            fontFamily: this.style.fontFamily,
            fill: this.style.fill,
            align: 'center'
        }).setOrigin(0.5);
        
        // Add to container
        this.container.add([this.background, this.textObject]);
        
        // Set up interactivity
        this.setupInteractivity();
    }
    
    updateBackground() {
        this.background.clear();
        
        let bgColor = this.style.backgroundColor;
        if (!this.isEnabled) {
            bgColor = '#666666';
        } else if (this.isPressed) {
            bgColor = '#2a5aa0';
        } else if (this.isHovered) {
            bgColor = '#5ba3f5';
        }
        
        // Draw background with rounded corners
        this.background.fillStyle(Phaser.Display.Color.HexStringToColor(bgColor).color);
        this.background.fillRoundedRect(
            -this.width / 2, -this.height / 2,
            this.width, this.height,
            this.style.borderRadius
        );
        
        // Draw border
        if (this.style.borderWidth > 0) {
            this.background.lineStyle(
                this.style.borderWidth,
                Phaser.Display.Color.HexStringToColor(this.style.borderColor).color
            );
            this.background.strokeRoundedRect(
                -this.width / 2, -this.height / 2,
                this.width, this.height,
                this.style.borderRadius
            );
        }
    }
    
    setupInteractivity() {
        // Create interactive area
        const hitArea = new Phaser.Geom.Rectangle(-this.width / 2, -this.height / 2, this.width, this.height);
        this.container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        // Mouse events
        this.container.on('pointerover', () => {
            if (!this.isEnabled) return;
            this.isHovered = true;
            this.updateBackground();
            if (this.onHover) this.onHover(true);
        });
        
        this.container.on('pointerout', () => {
            if (!this.isEnabled) return;
            this.isHovered = false;
            this.isPressed = false;
            this.updateBackground();
            if (this.onHover) this.onHover(false);
        });
        
        this.container.on('pointerdown', () => {
            if (!this.isEnabled) return;
            this.isPressed = true;
            this.updateBackground();
        });
        
        this.container.on('pointerup', () => {
            if (!this.isEnabled) return;
            if (this.isPressed && this.onClick) {
                this.onClick();
            }
            this.isPressed = false;
            this.updateBackground();
        });
    }
    
    setText(text) {
        this.text = text;
        this.textObject.setText(text);
    }
    
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.container.input.enabled = enabled;
        this.textObject.setAlpha(enabled ? 1 : 0.5);
        this.updateBackground();
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        this.container.setVisible(visible);
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.container.setPosition(x, y);
    }
    
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}

/**
 * Menu Component
 * Reusable menu with multiple options
 */

export class Menu {
    constructor(scene, x, y, options = []) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.options = options;
        this.buttons = [];
        this.background = null;
        this.title = null;
        this.isVisible = true;
        
        this.style = {
            buttonWidth: 200,
            buttonHeight: 50,
            buttonSpacing: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 10,
            padding: 30,
            titleStyle: {
                fontSize: '32px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        };
        
        this.create();
    }
    
    create() {
        // Create container
        this.container = this.scene.add.container(this.x, this.y);
        
        // Calculate menu dimensions
        const menuWidth = this.style.buttonWidth + (this.style.padding * 2);
        const menuHeight = this.title ? 
            (this.options.length * (this.style.buttonHeight + this.style.buttonSpacing)) + 
            this.style.padding * 2 + 60 :
            (this.options.length * (this.style.buttonHeight + this.style.buttonSpacing)) + 
            this.style.padding * 2;
        
        // Create background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.8);
        this.background.fillRoundedRect(
            -menuWidth / 2, -menuHeight / 2,
            menuWidth, menuHeight,
            this.style.borderRadius
        );
        
        if (this.style.borderWidth > 0) {
            this.background.lineStyle(this.style.borderWidth, 0xffffff);
            this.background.strokeRoundedRect(
                -menuWidth / 2, -menuHeight / 2,
                menuWidth, menuHeight,
                this.style.borderRadius
            );
        }
        
        this.container.add(this.background);
        
        // Create title if provided
        if (this.title) {
            const titleText = this.scene.add.text(0, -menuHeight / 2 + 40, this.title, this.style.titleStyle)
                .setOrigin(0.5);
            this.container.add(titleText);
        }
        
        // Create buttons
        this.createButtons();
    }
    
    createButtons() {
        const startY = this.title ? -50 : -(this.options.length * (this.style.buttonHeight + this.style.buttonSpacing)) / 2;
        
        this.options.forEach((option, index) => {
            const buttonY = startY + (index * (this.style.buttonHeight + this.style.buttonSpacing));
            
            const button = new Button(
                this.scene,
                0, buttonY,
                this.style.buttonWidth,
                this.style.buttonHeight,
                option.text,
                option.style || {}
            );
            
            button.onClick = option.callback;
            this.buttons.push(button);
            this.container.add(button.container);
        });
    }
    
    setTitle(title) {
        this.title = title;
        // Recreate menu with new title
        this.destroy();
        this.create();
    }
    
    addOption(text, callback, style = {}) {
        this.options.push({ text, callback, style });
        // Recreate buttons
        this.buttons.forEach(button => button.destroy());
        this.buttons = [];
        this.createButtons();
    }
    
    removeOption(index) {
        if (index >= 0 && index < this.options.length) {
            this.options.splice(index, 1);
            this.buttons[index].destroy();
            this.buttons.splice(index, 1);
            // Recreate remaining buttons
            this.buttons.forEach(button => button.destroy());
            this.buttons = [];
            this.createButtons();
        }
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        this.container.setVisible(visible);
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.container.setPosition(x, y);
    }
    
    destroy() {
        this.buttons.forEach(button => button.destroy());
        if (this.container) {
            this.container.destroy();
        }
    }
}

/**
 * HUD Component
 * Heads-up display for game information
 */

export class HUD {
    constructor(scene) {
        this.scene = scene;
        this.elements = new Map();
        this.container = null;
        this.isVisible = true;
        
        this.create();
    }
    
    create() {
        this.container = this.scene.add.container(0, 0);
        
        // Pot display
        this.addElement('pot', {
            type: 'text',
            x: 400,
            y: 50,
            text: 'Pot: $0',
            style: {
                fontSize: '24px',
                fontFamily: 'Arial',
                fill: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 15, y: 8 }
            }
        });
        
        // Phase display
        this.addElement('phase', {
            type: 'text',
            x: 400,
            y: 100,
            text: 'Waiting...',
            style: {
                fontSize: '18px',
                fontFamily: 'Arial',
                fill: '#ffff00'
            }
        });
        
        // Player stats
        this.addElement('stats', {
            type: 'text',
            x: 50,
            y: 50,
            text: 'Games: 0 | Won: 0',
            style: {
                fontSize: '16px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        });
        
        // Game controls info
        this.addElement('controls', {
            type: 'text',
            x: 50,
            y: 550,
            text: 'Controls: C=Check/Call | R=Raise | F=Fold | A=All-in | P=Pause | ESC=Menu',
            style: {
                fontSize: '12px',
                fontFamily: 'Arial',
                fill: '#cccccc'
            }
        });
    }
    
    addElement(key, config) {
        let element;
        
        switch (config.type) {
            case 'text':
                element = this.scene.add.text(config.x, config.y, config.text, config.style);
                if (config.origin) element.setOrigin(config.origin.x, config.origin.y);
                break;
                
            case 'image':
                element = this.scene.add.image(config.x, config.y, config.texture);
                if (config.scale) element.setScale(config.scale);
                break;
                
            case 'graphics':
                element = this.scene.add.graphics();
                element.setPosition(config.x, config.y);
                break;
        }
        
        if (element) {
            this.elements.set(key, element);
            this.container.add(element);
        }
    }
    
    updateElement(key, property, value) {
        const element = this.elements.get(key);
        if (element) {
            if (property === 'text' && element.setText) {
                element.setText(value);
            } else if (property === 'texture' && element.setTexture) {
                element.setTexture(value);
            } else if (property === 'position') {
                element.setPosition(value.x, value.y);
            } else if (property === 'visible') {
                element.setVisible(value);
            } else if (property === 'alpha') {
                element.setAlpha(value);
            }
        }
    }
    
    removeElement(key) {
        const element = this.elements.get(key);
        if (element) {
            element.destroy();
            this.elements.delete(key);
        }
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        this.container.setVisible(visible);
    }
    
    destroy() {
        this.elements.forEach(element => element.destroy());
        this.elements.clear();
        if (this.container) {
            this.container.destroy();
        }
    }
}

/**
 * Dialog Component
 * Modal dialog for user input and notifications
 */

export class Dialog {
    constructor(scene, title, message, buttons = []) {
        this.scene = scene;
        this.title = title;
        this.message = message;
        this.buttons = buttons;
        this.container = null;
        this.background = null;
        this.isVisible = false;
        this.onClose = null;
        
        this.style = {
            width: 400,
            height: 250,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 10,
            padding: 20,
            titleStyle: {
                fontSize: '24px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            },
            messageStyle: {
                fontSize: '16px',
                fontFamily: 'Arial',
                fill: '#cccccc',
                wordWrap: { width: 360, useAdvancedWrap: true }
            }
        };
        
        this.create();
    }
    
    create() {
        // Create modal background
        this.modalBackground = this.scene.add.graphics();
        this.modalBackground.fillStyle(0x000000, 0.5);
        this.modalBackground.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        this.modalBackground.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.scale.width, this.scene.scale.height), Phaser.Geom.Rectangle.Contains);
        
        // Create dialog container
        this.container = this.scene.add.container(
            this.scene.scale.width / 2,
            this.scene.scale.height / 2
        );
        
        // Create dialog background
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.9);
        this.background.fillRoundedRect(
            -this.style.width / 2, -this.style.height / 2,
            this.style.width, this.style.height,
            this.style.borderRadius
        );
        
        this.background.lineStyle(this.style.borderWidth, 0xffffff);
        this.background.strokeRoundedRect(
            -this.style.width / 2, -this.style.height / 2,
            this.style.width, this.style.height,
            this.style.borderRadius
        );
        
        // Create title
        const titleText = this.scene.add.text(0, -this.style.height / 2 + 40, this.title, this.style.titleStyle)
            .setOrigin(0.5);
        
        // Create message
        const messageText = this.scene.add.text(0, -20, this.message, this.style.messageStyle)
            .setOrigin(0.5);
        
        // Add elements to container
        this.container.add([this.background, titleText, messageText]);
        
        // Create buttons
        this.createButtons();
        
        // Initially hidden
        this.setVisible(false);
    }
    
    createButtons() {
        if (this.buttons.length === 0) {
            // Default OK button
            this.buttons = [{ text: 'OK', callback: () => this.close() }];
        }
        
        const buttonWidth = 100;
        const buttonHeight = 35;
        const buttonSpacing = 20;
        const totalWidth = (this.buttons.length * buttonWidth) + ((this.buttons.length - 1) * buttonSpacing);
        const startX = -totalWidth / 2 + buttonWidth / 2;
        
        this.buttons.forEach((buttonConfig, index) => {
            const buttonX = startX + (index * (buttonWidth + buttonSpacing));
            const buttonY = this.style.height / 2 - 40;
            
            const button = new Button(
                this.scene,
                buttonX, buttonY,
                buttonWidth, buttonHeight,
                buttonConfig.text
            );
            
            button.onClick = () => {
                if (buttonConfig.callback) buttonConfig.callback();
                this.close();
            };
            
            this.container.add(button.container);
        });
    }
    
    show() {
        this.setVisible(true);
        
        // Animate in
        this.container.setScale(0);
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    close() {
        // Animate out
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 0,
            scaleY: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => {
                this.setVisible(false);
                if (this.onClose) this.onClose();
            }
        });
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        this.modalBackground.setVisible(visible);
        this.container.setVisible(visible);
    }
    
    destroy() {
        if (this.modalBackground) this.modalBackground.destroy();
        if (this.container) this.container.destroy();
    }
}