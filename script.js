
class inputController{
    static ACTION_ACTIVATED = 'input-controller:action-activated';
    static ACTION_DEACTIVATED = 'input-controller:action-deactivated';

    constructor(actionsToBind = null, target = null){
        this.target = target;
        this.focused = document.hasFocus();
        this.enabled = true;
        this.actionsToBind = actionsToBind;

        this.actions = new Map();
        this.actionsKeys = new Map();
        this.keysActive = new Set();

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.bindActions(actionsToBind);

        this.attach(this.target);


        window.addEventListener('blur', () => {
        this.focused = false;
    });

    window.addEventListener('focus', () => {
        this.focused = true;
    });

    }

    addActivity(actionsToBind){
        if ( !actionsToBind) return;
        this.bindActions(actionsToBind);
    }

    onKeyDown(e){
        if(!this.focused || !this.enabled) return;
        if (!this.keysActive.has(e.keyCode))
            this.keysActive.add(e.keyCode);
        
        let listActionsName = this.actionsKeys.get(e.keyCode);
        if(listActionsName){
            for (let action of listActionsName){
                let act = this.actions.get(action);
                if (act && act.enabled){
                    let event = new CustomEvent(inputController.ACTION_ACTIVATED, {detail: {act: action}});
                    this.target.dispatchEvent(event);
                }
            }
        }

    }

    onKeyUp(e){
        if(!this.focused || !this.enabled) return;
        if (this.keysActive.has(e.keyCode))
            this.keysActive.delete(e.keyCode);

        let listActionsName = this.actionsKeys.get(e.keyCode);
        if(listActionsName){
            for (let action of listActionsName){
                let act = this.actions.get(action);
                if (act && act.enabled){
                    let event = new CustomEvent(inputController.ACTION_DEACTIVATED, {detail: {act: action}});
                    this.target.dispatchEvent(event);
                }
            }
        }
    }

    bindActions(actionsToBind) {
        if (actionsToBind){
           for (const [actionName, config] of Object.entries(actionsToBind)) {
            let keys = config.keys || [];
            let enabled = config.enabled;
            
            if (!this.actions.has(actionName)){
                this.actions.set(actionName, {keys, enabled});

                for (let key of keys){
                    if (!this.actionsKeys.has(key))
                        this.actionsKeys.set(key, new Set());
                    this.actionsKeys.get(key).add(actionName);
                    
                    }
                }
            }
        }
    }

    enableAction(actionName){
        let action = this.actions.get(actionName);
        if (action)
            action.enabled = true;
    }

    disableAction(actionName){
        let action = this.actions.get(actionName);
        if (action){
            action.enabled = false;
        }
    }

    attach(target, dontEnable=false){
        if (this.target){
            this.detach(true);
        }
        this.target = target;
        this.target.addEventListener('keyup', this.onKeyUp);
        this.target.addEventListener('keydown', this.onKeyDown);
        

        if (!dontEnable) {
            this.enabled = true;
            for (const [actionName, actionConfig] of this.actions) {
                this.enableAction(actionName);
            }
        }
    }

    detach(dontEnable = false){

        if (this.target) {
        this.target.removeEventListener('keydown', this.onKeyDown);
        this.target.removeEventListener('keyup', this.onKeyUp);
    }

        this.keysActive.clear();

        
    }
    isKeyPressed(key){
        if (this.keysActive.has(key))
            return true;
        else return false;
    }

    isActionActive(actionName){
        let action = this.actions.get(actionName);
        if (!action || !action.enabled){
            return false;
        }
        let listKeys = action.keys;
        for (let key of listKeys){
            if ( this.isKeyPressed(key))
                return true;
        }
        return false;

    }
}