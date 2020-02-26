class StepController {
    private static _ins: StepController;
    public static get inst() {
        return this._ins ? this._ins : this._ins = new StepController();
    }

    private constructor() {

    }


    private completeCallback: Function;
    private totalStep: string[] = [];
    private curStep: string[] = [];
    register(complete: Function, totalSteps: string[]) {
        this.completeCallback = complete;
        this.totalStep = totalSteps;
    }


    
    nextStep(step: string) {
        if (this.totalStep.indexOf(step) < 0) {
            console.error(" 没有这一步：", step);
            return;
        }

        if (this.curStep.indexOf(step) >= 0) {
            console.warn(" 步骤已完成：", step);
            return;
        }

        this.curStep.push(step);

        this.curStep.sort((a,b)=>{return a > b ? -1 : 1});
        this.totalStep.sort((a,b)=>{return a > b ? -1 : 1});
        console.log(' cur step:', this.curStep.join(","));
        console.log(' total step:', this.totalStep.join(","));

        if (this.curStep.join(",") == this.totalStep.join(",")) {
            this.totalStep.length = 0;
            this.completeCallback();
            this.completeCallback = null;
        }
    }




}

export const gStep = StepController.inst;