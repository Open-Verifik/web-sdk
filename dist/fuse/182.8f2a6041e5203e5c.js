"use strict";(self.webpackChunkfuse=self.webpackChunkfuse||[]).push([[182],{9559:(L,M,u)=>{u.d(M,{K:()=>f});var c=u(5879);let f=(()=>{class t{constructor(){this.countryCodes=[{code:"+54",name:"Argentina"},{code:"+61",name:"Australia"},{code:"+43",name:"Austria"},{code:"+32",name:"Belgium"},{code:"+55",name:"Brazil"},{code:"+1",name:"Canada"},{code:"+56",name:"Chile"},{code:"+57",name:"Colombia"},{code:"+506",name:"Costa Rica"},{code:"+593",name:"Ecuador"},{code:"+503",name:"El Salvador"},{code:"+33",name:"France"},{code:"+49",name:"Germany"},{code:"+502",name:"Guatemala"},{code:"+504",name:"Honduras"},{code:"+353",name:"Ireland"},{code:"+39",name:"Italy"},{code:"+52",name:"Mexico"},{code:"+31",name:"Netherlands"},{code:"+505",name:"Nicaragua"},{code:"+47",name:"Norway"},{code:"+507",name:"Panama"},{code:"+595",name:"Paraguay"},{code:"+51",name:"Peru"},{code:"+351",name:"Portugal"},{code:"+1-787",name:"Puerto Rico"},{code:"+1-939",name:"Puerto Rico"},{code:"+7",name:"Russia"},{code:"+34",name:"Spain"},{code:"+46",name:"Sweden"},{code:"+41",name:"Switzerland"},{code:"+1-868",name:"Trinidad and Tobago"},{code:"+44",name:"United Kingdom"},{code:"+1",name:"United States of America"},{code:"+598",name:"Uruguay"},{code:"+58",name:"Venezuela"}]}static#e=this.\u0275fac=function(I){return new(I||t)};static#t=this.\u0275prov=c.Yz7({token:t,factory:t.\u0275fac,providedIn:"root"})}return t})()},4354:(L,M,u)=>{u.d(M,{w:()=>c});var c=function(f){return f.ENVIRONMENT="environment",f.USER="user",f.true="environment",f.false="user",f}(c||{})},4913:(L,M,u)=>{u.d(M,{gD:()=>me,LD:()=>fe,$L:()=>ge});var c=u(9594),f=u(6814),t=u(5879),_=u(3680),E=u(1043),I=u(5407),R=u(4300),F=u(9388),k=u(2495),T=u(8645);class l{get selected(){return this._selected||(this._selected=Array.from(this._selection.values())),this._selected}constructor(a=!1,e,i=!0,n){this._multiple=a,this._emitChanges=i,this.compareWith=n,this._selection=new Set,this._deselectedToEmit=[],this._selectedToEmit=[],this.changed=new T.x,e&&e.length&&(a?e.forEach(r=>this._markSelected(r)):this._markSelected(e[0]),this._selectedToEmit.length=0)}select(...a){this._verifyValueAssignment(a),a.forEach(i=>this._markSelected(i));const e=this._hasQueuedChanges();return this._emitChangeEvent(),e}deselect(...a){this._verifyValueAssignment(a),a.forEach(i=>this._unmarkSelected(i));const e=this._hasQueuedChanges();return this._emitChangeEvent(),e}setSelection(...a){this._verifyValueAssignment(a);const e=this.selected,i=new Set(a);a.forEach(r=>this._markSelected(r)),e.filter(r=>!i.has(r)).forEach(r=>this._unmarkSelected(r));const n=this._hasQueuedChanges();return this._emitChangeEvent(),n}toggle(a){return this.isSelected(a)?this.deselect(a):this.select(a)}clear(a=!0){this._unmarkAll();const e=this._hasQueuedChanges();return a&&this._emitChangeEvent(),e}isSelected(a){return this._selection.has(this._getConcreteValue(a))}isEmpty(){return 0===this._selection.size}hasValue(){return!this.isEmpty()}sort(a){this._multiple&&this.selected&&this._selected.sort(a)}isMultipleSelection(){return this._multiple}_emitChangeEvent(){this._selected=null,(this._selectedToEmit.length||this._deselectedToEmit.length)&&(this.changed.next({source:this,added:this._selectedToEmit,removed:this._deselectedToEmit}),this._deselectedToEmit=[],this._selectedToEmit=[])}_markSelected(a){a=this._getConcreteValue(a),this.isSelected(a)||(this._multiple||this._unmarkAll(),this.isSelected(a)||this._selection.add(a),this._emitChanges&&this._selectedToEmit.push(a))}_unmarkSelected(a){a=this._getConcreteValue(a),this.isSelected(a)&&(this._selection.delete(a),this._emitChanges&&this._deselectedToEmit.push(a))}_unmarkAll(){this.isEmpty()||this._selection.forEach(a=>this._unmarkSelected(a))}_verifyValueAssignment(a){}_hasQueuedChanges(){return!(!this._deselectedToEmit.length&&!this._selectedToEmit.length)}_getConcreteValue(a){if(this.compareWith){for(let e of this._selection)if(this.compareWith(a,e))return e;return a}return a}}var m=u(6028),O=u(6223),P=u(4911),B=u(3019),Q=u(7921),H=u(4664),z=u(8180),Y=u(2181),N=u(7398),q=u(3997),x=u(9773),y=u(6825);const X=["trigger"],$=["panel"];function ee(o,a){if(1&o&&(t.TgZ(0,"span",10),t._uU(1),t.qZA()),2&o){const e=t.oxw();t.xp6(1),t.Oqu(e.placeholder)}}function te(o,a){if(1&o&&(t.TgZ(0,"span",14),t._uU(1),t.qZA()),2&o){const e=t.oxw(2);t.xp6(1),t.Oqu(e.triggerValue)}}function ie(o,a){1&o&&t.Hsn(0,0,["*ngSwitchCase","true"])}function se(o,a){if(1&o&&(t.TgZ(0,"span",11),t.YNc(1,te,2,1,"span",12),t.YNc(2,ie,1,0,"ng-content",13),t.qZA()),2&o){const e=t.oxw();t.Q6J("ngSwitch",!!e.customTrigger),t.xp6(2),t.Q6J("ngSwitchCase",!0)}}function ne(o,a){if(1&o){const e=t.EpF();t.O4$(),t.kcU(),t.TgZ(0,"div",15,16),t.NdJ("@transformPanel.done",function(n){t.CHM(e);const r=t.oxw();return t.KtG(r._panelDoneAnimatingStream.next(n.toState))})("keydown",function(n){t.CHM(e);const r=t.oxw();return t.KtG(r._handleKeydown(n))}),t.Hsn(2,1),t.qZA()}if(2&o){const e=t.oxw();t.Gre("mat-mdc-select-panel mdc-menu-surface mdc-menu-surface--open ",e._getPanelTheme(),""),t.Q6J("ngClass",e.panelClass)("@transformPanel","showing"),t.uIk("id",e.id+"-panel")("aria-multiselectable",e.multiple)("aria-label",e.ariaLabel||null)("aria-labelledby",e._getPanelAriaLabelledby())}}const ae=[[["mat-select-trigger"]],"*"],re=["mat-select-trigger","*"],oe={transformPanelWrap:(0,y.X$)("transformPanelWrap",[(0,y.eR)("* => void",(0,y.IO)("@transformPanel",[(0,y.pV)()],{optional:!0}))]),transformPanel:(0,y.X$)("transformPanel",[(0,y.SB)("void",(0,y.oB)({opacity:0,transform:"scale(1, 0.8)"})),(0,y.eR)("void => showing",(0,y.jt)("120ms cubic-bezier(0, 0, 0.2, 1)",(0,y.oB)({opacity:1,transform:"scale(1, 1)"}))),(0,y.eR)("* => void",(0,y.jt)("100ms linear",(0,y.oB)({opacity:0})))])};let J=0;const W=new t.OlP("mat-select-scroll-strategy"),ce=new t.OlP("MAT_SELECT_CONFIG"),he={provide:W,deps:[c.aV],useFactory:function le(o){return()=>o.scrollStrategies.reposition()}},Z=new t.OlP("MatSelectTrigger");class de{constructor(a,e){this.source=a,this.value=e}}const ue=(0,_.Kr)((0,_.sb)((0,_.Id)((0,_.FD)(class{constructor(o,a,e,i,n){this._elementRef=o,this._defaultErrorStateMatcher=a,this._parentForm=e,this._parentFormGroup=i,this.ngControl=n,this.stateChanges=new T.x}}))));let pe=(()=>{class o extends ue{get focused(){return this._focused||this._panelOpen}get placeholder(){return this._placeholder}set placeholder(e){this._placeholder=e,this.stateChanges.next()}get required(){return this._required??this.ngControl?.control?.hasValidator(O.kI.required)??!1}set required(e){this._required=(0,k.Ig)(e),this.stateChanges.next()}get multiple(){return this._multiple}set multiple(e){this._multiple=(0,k.Ig)(e)}get disableOptionCentering(){return this._disableOptionCentering}set disableOptionCentering(e){this._disableOptionCentering=(0,k.Ig)(e)}get compareWith(){return this._compareWith}set compareWith(e){this._compareWith=e,this._selectionModel&&this._initializeSelection()}get value(){return this._value}set value(e){this._assignValue(e)&&this._onChange(e)}get typeaheadDebounceInterval(){return this._typeaheadDebounceInterval}set typeaheadDebounceInterval(e){this._typeaheadDebounceInterval=(0,k.su)(e)}get id(){return this._id}set id(e){this._id=e||this._uid,this.stateChanges.next()}constructor(e,i,n,r,d,v,g,S,w,D,_e,ve,ye,U){super(d,r,g,S,D),this._viewportRuler=e,this._changeDetectorRef=i,this._ngZone=n,this._dir=v,this._parentFormField=w,this._liveAnnouncer=ye,this._defaultOptions=U,this._panelOpen=!1,this._compareWith=(A,G)=>A===G,this._uid="mat-select-"+J++,this._triggerAriaLabelledBy=null,this._destroy=new T.x,this._onChange=()=>{},this._onTouched=()=>{},this._valueId="mat-select-value-"+J++,this._panelDoneAnimatingStream=new T.x,this._overlayPanelClass=this._defaultOptions?.overlayPanelClass||"",this._focused=!1,this.controlType="mat-select",this._multiple=!1,this._disableOptionCentering=this._defaultOptions?.disableOptionCentering??!1,this.ariaLabel="",this.optionSelectionChanges=(0,P.P)(()=>{const A=this.options;return A?A.changes.pipe((0,Q.O)(A),(0,H.w)(()=>(0,B.T)(...A.map(G=>G.onSelectionChange)))):this._ngZone.onStable.pipe((0,z.q)(1),(0,H.w)(()=>this.optionSelectionChanges))}),this.openedChange=new t.vpe,this._openedStream=this.openedChange.pipe((0,Y.h)(A=>A),(0,N.U)(()=>{})),this._closedStream=this.openedChange.pipe((0,Y.h)(A=>!A),(0,N.U)(()=>{})),this.selectionChange=new t.vpe,this.valueChange=new t.vpe,this.ngControl&&(this.ngControl.valueAccessor=this),null!=U?.typeaheadDebounceInterval&&(this._typeaheadDebounceInterval=U.typeaheadDebounceInterval),this._scrollStrategyFactory=ve,this._scrollStrategy=this._scrollStrategyFactory(),this.tabIndex=parseInt(_e)||0,this.id=this.id}ngOnInit(){this._selectionModel=new l(this.multiple),this.stateChanges.next(),this._panelDoneAnimatingStream.pipe((0,q.x)(),(0,x.R)(this._destroy)).subscribe(()=>this._panelDoneAnimating(this.panelOpen))}ngAfterContentInit(){this._initKeyManager(),this._selectionModel.changed.pipe((0,x.R)(this._destroy)).subscribe(e=>{e.added.forEach(i=>i.select()),e.removed.forEach(i=>i.deselect())}),this.options.changes.pipe((0,Q.O)(null),(0,x.R)(this._destroy)).subscribe(()=>{this._resetOptions(),this._initializeSelection()})}ngDoCheck(){const e=this._getTriggerAriaLabelledby(),i=this.ngControl;if(e!==this._triggerAriaLabelledBy){const n=this._elementRef.nativeElement;this._triggerAriaLabelledBy=e,e?n.setAttribute("aria-labelledby",e):n.removeAttribute("aria-labelledby")}i&&(this._previousControl!==i.control&&(void 0!==this._previousControl&&null!==i.disabled&&i.disabled!==this.disabled&&(this.disabled=i.disabled),this._previousControl=i.control),this.updateErrorState())}ngOnChanges(e){(e.disabled||e.userAriaDescribedBy)&&this.stateChanges.next(),e.typeaheadDebounceInterval&&this._keyManager&&this._keyManager.withTypeAhead(this._typeaheadDebounceInterval)}ngOnDestroy(){this._keyManager?.destroy(),this._destroy.next(),this._destroy.complete(),this.stateChanges.complete()}toggle(){this.panelOpen?this.close():this.open()}open(){this._canOpen()&&(this._panelOpen=!0,this._keyManager.withHorizontalOrientation(null),this._highlightCorrectOption(),this._changeDetectorRef.markForCheck())}close(){this._panelOpen&&(this._panelOpen=!1,this._keyManager.withHorizontalOrientation(this._isRtl()?"rtl":"ltr"),this._changeDetectorRef.markForCheck(),this._onTouched())}writeValue(e){this._assignValue(e)}registerOnChange(e){this._onChange=e}registerOnTouched(e){this._onTouched=e}setDisabledState(e){this.disabled=e,this._changeDetectorRef.markForCheck(),this.stateChanges.next()}get panelOpen(){return this._panelOpen}get selected(){return this.multiple?this._selectionModel?.selected||[]:this._selectionModel?.selected[0]}get triggerValue(){if(this.empty)return"";if(this._multiple){const e=this._selectionModel.selected.map(i=>i.viewValue);return this._isRtl()&&e.reverse(),e.join(", ")}return this._selectionModel.selected[0].viewValue}_isRtl(){return!!this._dir&&"rtl"===this._dir.value}_handleKeydown(e){this.disabled||(this.panelOpen?this._handleOpenKeydown(e):this._handleClosedKeydown(e))}_handleClosedKeydown(e){const i=e.keyCode,n=i===m.JH||i===m.LH||i===m.oh||i===m.SV,r=i===m.K5||i===m.L_,d=this._keyManager;if(!d.isTyping()&&r&&!(0,m.Vb)(e)||(this.multiple||e.altKey)&&n)e.preventDefault(),this.open();else if(!this.multiple){const v=this.selected;d.onKeydown(e);const g=this.selected;g&&v!==g&&this._liveAnnouncer.announce(g.viewValue,1e4)}}_handleOpenKeydown(e){const i=this._keyManager,n=e.keyCode,r=n===m.JH||n===m.LH,d=i.isTyping();if(r&&e.altKey)e.preventDefault(),this.close();else if(d||n!==m.K5&&n!==m.L_||!i.activeItem||(0,m.Vb)(e))if(!d&&this._multiple&&n===m.A&&e.ctrlKey){e.preventDefault();const v=this.options.some(g=>!g.disabled&&!g.selected);this.options.forEach(g=>{g.disabled||(v?g.select():g.deselect())})}else{const v=i.activeItemIndex;i.onKeydown(e),this._multiple&&r&&e.shiftKey&&i.activeItem&&i.activeItemIndex!==v&&i.activeItem._selectViaInteraction()}else e.preventDefault(),i.activeItem._selectViaInteraction()}_onFocus(){this.disabled||(this._focused=!0,this.stateChanges.next())}_onBlur(){this._focused=!1,this._keyManager?.cancelTypeahead(),!this.disabled&&!this.panelOpen&&(this._onTouched(),this._changeDetectorRef.markForCheck(),this.stateChanges.next())}_onAttached(){this._overlayDir.positionChange.pipe((0,z.q)(1)).subscribe(()=>{this._changeDetectorRef.detectChanges(),this._positioningSettled()})}_getPanelTheme(){return this._parentFormField?`mat-${this._parentFormField.color}`:""}get empty(){return!this._selectionModel||this._selectionModel.isEmpty()}_initializeSelection(){Promise.resolve().then(()=>{this.ngControl&&(this._value=this.ngControl.value),this._setSelectionByValue(this._value),this.stateChanges.next()})}_setSelectionByValue(e){if(this.options.forEach(i=>i.setInactiveStyles()),this._selectionModel.clear(),this.multiple&&e)Array.isArray(e),e.forEach(i=>this._selectOptionByValue(i)),this._sortValues();else{const i=this._selectOptionByValue(e);i?this._keyManager.updateActiveItem(i):this.panelOpen||this._keyManager.updateActiveItem(-1)}this._changeDetectorRef.markForCheck()}_selectOptionByValue(e){const i=this.options.find(n=>{if(this._selectionModel.isSelected(n))return!1;try{return null!=n.value&&this._compareWith(n.value,e)}catch{return!1}});return i&&this._selectionModel.select(i),i}_assignValue(e){return!!(e!==this._value||this._multiple&&Array.isArray(e))&&(this.options&&this._setSelectionByValue(e),this._value=e,!0)}_skipPredicate(e){return e.disabled}_initKeyManager(){this._keyManager=new R.s1(this.options).withTypeAhead(this._typeaheadDebounceInterval).withVerticalOrientation().withHorizontalOrientation(this._isRtl()?"rtl":"ltr").withHomeAndEnd().withPageUpDown().withAllowedModifierKeys(["shiftKey"]).skipPredicate(this._skipPredicate),this._keyManager.tabOut.subscribe(()=>{this.panelOpen&&(!this.multiple&&this._keyManager.activeItem&&this._keyManager.activeItem._selectViaInteraction(),this.focus(),this.close())}),this._keyManager.change.subscribe(()=>{this._panelOpen&&this.panel?this._scrollOptionIntoView(this._keyManager.activeItemIndex||0):!this._panelOpen&&!this.multiple&&this._keyManager.activeItem&&this._keyManager.activeItem._selectViaInteraction()})}_resetOptions(){const e=(0,B.T)(this.options.changes,this._destroy);this.optionSelectionChanges.pipe((0,x.R)(e)).subscribe(i=>{this._onSelect(i.source,i.isUserInput),i.isUserInput&&!this.multiple&&this._panelOpen&&(this.close(),this.focus())}),(0,B.T)(...this.options.map(i=>i._stateChanges)).pipe((0,x.R)(e)).subscribe(()=>{this._changeDetectorRef.detectChanges(),this.stateChanges.next()})}_onSelect(e,i){const n=this._selectionModel.isSelected(e);null!=e.value||this._multiple?(n!==e.selected&&(e.selected?this._selectionModel.select(e):this._selectionModel.deselect(e)),i&&this._keyManager.setActiveItem(e),this.multiple&&(this._sortValues(),i&&this.focus())):(e.deselect(),this._selectionModel.clear(),null!=this.value&&this._propagateChanges(e.value)),n!==this._selectionModel.isSelected(e)&&this._propagateChanges(),this.stateChanges.next()}_sortValues(){if(this.multiple){const e=this.options.toArray();this._selectionModel.sort((i,n)=>this.sortComparator?this.sortComparator(i,n,e):e.indexOf(i)-e.indexOf(n)),this.stateChanges.next()}}_propagateChanges(e){let i=null;i=this.multiple?this.selected.map(n=>n.value):this.selected?this.selected.value:e,this._value=i,this.valueChange.emit(i),this._onChange(i),this.selectionChange.emit(this._getChangeEvent(i)),this._changeDetectorRef.markForCheck()}_highlightCorrectOption(){if(this._keyManager)if(this.empty){let e=-1;for(let i=0;i<this.options.length;i++)if(!this.options.get(i).disabled){e=i;break}this._keyManager.setActiveItem(e)}else this._keyManager.setActiveItem(this._selectionModel.selected[0])}_canOpen(){return!this._panelOpen&&!this.disabled&&this.options?.length>0}focus(e){this._elementRef.nativeElement.focus(e)}_getPanelAriaLabelledby(){if(this.ariaLabel)return null;const e=this._parentFormField?.getLabelId();return this.ariaLabelledby?(e?e+" ":"")+this.ariaLabelledby:e}_getAriaActiveDescendant(){return this.panelOpen&&this._keyManager&&this._keyManager.activeItem?this._keyManager.activeItem.id:null}_getTriggerAriaLabelledby(){if(this.ariaLabel)return null;const e=this._parentFormField?.getLabelId();let i=(e?e+" ":"")+this._valueId;return this.ariaLabelledby&&(i+=" "+this.ariaLabelledby),i}_panelDoneAnimating(e){this.openedChange.emit(e)}setDescribedByIds(e){e.length?this._elementRef.nativeElement.setAttribute("aria-describedby",e.join(" ")):this._elementRef.nativeElement.removeAttribute("aria-describedby")}onContainerClick(){this.focus(),this.open()}get shouldLabelFloat(){return this._panelOpen||!this.empty||this._focused&&!!this._placeholder}static#e=this.\u0275fac=function(i){return new(i||o)(t.Y36(I.rL),t.Y36(t.sBO),t.Y36(t.R0b),t.Y36(_.rD),t.Y36(t.SBq),t.Y36(F.Is,8),t.Y36(O.F,8),t.Y36(O.sg,8),t.Y36(E.G_,8),t.Y36(O.a5,10),t.$8M("tabindex"),t.Y36(W),t.Y36(R.Kd),t.Y36(ce,8))};static#t=this.\u0275dir=t.lG2({type:o,viewQuery:function(i,n){if(1&i&&(t.Gf(X,5),t.Gf($,5),t.Gf(c.pI,5)),2&i){let r;t.iGM(r=t.CRH())&&(n.trigger=r.first),t.iGM(r=t.CRH())&&(n.panel=r.first),t.iGM(r=t.CRH())&&(n._overlayDir=r.first)}},inputs:{userAriaDescribedBy:["aria-describedby","userAriaDescribedBy"],panelClass:"panelClass",placeholder:"placeholder",required:"required",multiple:"multiple",disableOptionCentering:"disableOptionCentering",compareWith:"compareWith",value:"value",ariaLabel:["aria-label","ariaLabel"],ariaLabelledby:["aria-labelledby","ariaLabelledby"],errorStateMatcher:"errorStateMatcher",typeaheadDebounceInterval:"typeaheadDebounceInterval",sortComparator:"sortComparator",id:"id"},outputs:{openedChange:"openedChange",_openedStream:"opened",_closedStream:"closed",selectionChange:"selectionChange",valueChange:"valueChange"},features:[t.qOj,t.TTD]})}return o})(),ge=(()=>{class o{static#e=this.\u0275fac=function(i){return new(i||o)};static#t=this.\u0275dir=t.lG2({type:o,selectors:[["mat-select-trigger"]],features:[t._Bn([{provide:Z,useExisting:o}])]})}return o})(),me=(()=>{class o extends pe{constructor(){super(...arguments),this._positions=[{originX:"start",originY:"bottom",overlayX:"start",overlayY:"top"},{originX:"start",originY:"top",overlayX:"start",overlayY:"bottom",panelClass:"mat-mdc-select-panel-above"}],this._hideSingleSelectionIndicator=this._defaultOptions?.hideSingleSelectionIndicator??!1,this._skipPredicate=e=>!this.panelOpen&&e.disabled}get shouldLabelFloat(){return this.panelOpen||!this.empty||this.focused&&!!this.placeholder}ngOnInit(){super.ngOnInit(),this._viewportRuler.change().pipe((0,x.R)(this._destroy)).subscribe(()=>{this.panelOpen&&(this._overlayWidth=this._getOverlayWidth(),this._changeDetectorRef.detectChanges())})}ngAfterViewInit(){this._parentFormField&&(this._preferredOverlayOrigin=this._parentFormField.getConnectedOverlayOrigin())}open(){this._overlayWidth=this._getOverlayWidth(),super.open(),this.stateChanges.next()}close(){super.close(),this.stateChanges.next()}_scrollOptionIntoView(e){const i=this.options.toArray()[e];if(i){const n=this.panel.nativeElement,r=(0,_.CB)(e,this.options,this.optionGroups),d=i._getHostElement();n.scrollTop=0===e&&1===r?0:(0,_.jH)(d.offsetTop,d.offsetHeight,n.scrollTop,n.offsetHeight)}}_positioningSettled(){this._scrollOptionIntoView(this._keyManager.activeItemIndex||0)}_getChangeEvent(e){return new de(this,e)}_getOverlayWidth(){return(this._preferredOverlayOrigin instanceof c.xu?this._preferredOverlayOrigin.elementRef:this._preferredOverlayOrigin||this._elementRef).nativeElement.getBoundingClientRect().width}get hideSingleSelectionIndicator(){return this._hideSingleSelectionIndicator}set hideSingleSelectionIndicator(e){this._hideSingleSelectionIndicator=(0,k.Ig)(e),this._syncParentProperties()}_syncParentProperties(){if(this.options)for(const e of this.options)e._changeDetectorRef.markForCheck()}static#e=this.\u0275fac=function(){let e;return function(n){return(e||(e=t.n5z(o)))(n||o)}}();static#t=this.\u0275cmp=t.Xpm({type:o,selectors:[["mat-select"]],contentQueries:function(i,n,r){if(1&i&&(t.Suo(r,Z,5),t.Suo(r,_.ey,5),t.Suo(r,_.K7,5)),2&i){let d;t.iGM(d=t.CRH())&&(n.customTrigger=d.first),t.iGM(d=t.CRH())&&(n.options=d),t.iGM(d=t.CRH())&&(n.optionGroups=d)}},hostAttrs:["role","combobox","aria-autocomplete","none","aria-haspopup","listbox","ngSkipHydration","",1,"mat-mdc-select"],hostVars:19,hostBindings:function(i,n){1&i&&t.NdJ("keydown",function(d){return n._handleKeydown(d)})("focus",function(){return n._onFocus()})("blur",function(){return n._onBlur()}),2&i&&(t.uIk("id",n.id)("tabindex",n.tabIndex)("aria-controls",n.panelOpen?n.id+"-panel":null)("aria-expanded",n.panelOpen)("aria-label",n.ariaLabel||null)("aria-required",n.required.toString())("aria-disabled",n.disabled.toString())("aria-invalid",n.errorState)("aria-activedescendant",n._getAriaActiveDescendant()),t.ekj("mat-mdc-select-disabled",n.disabled)("mat-mdc-select-invalid",n.errorState)("mat-mdc-select-required",n.required)("mat-mdc-select-empty",n.empty)("mat-mdc-select-multiple",n.multiple))},inputs:{disabled:"disabled",disableRipple:"disableRipple",tabIndex:"tabIndex",hideSingleSelectionIndicator:"hideSingleSelectionIndicator"},exportAs:["matSelect"],features:[t._Bn([{provide:E.Eo,useExisting:o},{provide:_.HF,useExisting:o}]),t.qOj],ngContentSelectors:re,decls:11,vars:11,consts:[["cdk-overlay-origin","",1,"mat-mdc-select-trigger",3,"click"],["fallbackOverlayOrigin","cdkOverlayOrigin","trigger",""],[1,"mat-mdc-select-value",3,"ngSwitch"],["class","mat-mdc-select-placeholder mat-mdc-select-min-line",4,"ngSwitchCase"],["class","mat-mdc-select-value-text",3,"ngSwitch",4,"ngSwitchCase"],[1,"mat-mdc-select-arrow-wrapper"],[1,"mat-mdc-select-arrow"],["viewBox","0 0 24 24","width","24px","height","24px","focusable","false","aria-hidden","true"],["d","M7 10l5 5 5-5z"],["cdk-connected-overlay","","cdkConnectedOverlayLockPosition","","cdkConnectedOverlayHasBackdrop","","cdkConnectedOverlayBackdropClass","cdk-overlay-transparent-backdrop",3,"cdkConnectedOverlayPanelClass","cdkConnectedOverlayScrollStrategy","cdkConnectedOverlayOrigin","cdkConnectedOverlayOpen","cdkConnectedOverlayPositions","cdkConnectedOverlayWidth","backdropClick","attach","detach"],[1,"mat-mdc-select-placeholder","mat-mdc-select-min-line"],[1,"mat-mdc-select-value-text",3,"ngSwitch"],["class","mat-mdc-select-min-line",4,"ngSwitchDefault"],[4,"ngSwitchCase"],[1,"mat-mdc-select-min-line"],["role","listbox","tabindex","-1",3,"ngClass","keydown"],["panel",""]],template:function(i,n){if(1&i&&(t.F$t(ae),t.TgZ(0,"div",0,1),t.NdJ("click",function(){return n.toggle()}),t.TgZ(3,"div",2),t.YNc(4,ee,2,1,"span",3),t.YNc(5,se,3,2,"span",4),t.qZA(),t.TgZ(6,"div",5)(7,"div",6),t.O4$(),t.TgZ(8,"svg",7),t._UZ(9,"path",8),t.qZA()()()(),t.YNc(10,ne,3,9,"ng-template",9),t.NdJ("backdropClick",function(){return n.close()})("attach",function(){return n._onAttached()})("detach",function(){return n.close()})),2&i){const r=t.MAs(1);t.uIk("aria-owns",n.panelOpen?n.id+"-panel":null),t.xp6(3),t.Q6J("ngSwitch",n.empty),t.uIk("id",n._valueId),t.xp6(1),t.Q6J("ngSwitchCase",!0),t.xp6(1),t.Q6J("ngSwitchCase",!1),t.xp6(5),t.Q6J("cdkConnectedOverlayPanelClass",n._overlayPanelClass)("cdkConnectedOverlayScrollStrategy",n._scrollStrategy)("cdkConnectedOverlayOrigin",n._preferredOverlayOrigin||r)("cdkConnectedOverlayOpen",n.panelOpen)("cdkConnectedOverlayPositions",n._positions)("cdkConnectedOverlayWidth",n._overlayWidth)}},dependencies:[f.mk,f.RF,f.n9,f.ED,c.pI,c.xu],styles:['.mdc-menu-surface{display:none;position:absolute;box-sizing:border-box;margin:0;padding:0;transform:scale(1);transform-origin:top left;opacity:0;overflow:auto;will-change:transform,opacity;transform-origin-left:top left;transform-origin-right:top right}.mdc-menu-surface:focus{outline:none}.mdc-menu-surface--animating-open{display:inline-block;transform:scale(0.8);opacity:0}.mdc-menu-surface--open{display:inline-block;transform:scale(1);opacity:1}.mdc-menu-surface--animating-closed{display:inline-block;opacity:0}[dir=rtl] .mdc-menu-surface,.mdc-menu-surface[dir=rtl]{transform-origin-left:top right;transform-origin-right:top left}.mdc-menu-surface--anchor{position:relative;overflow:visible}.mdc-menu-surface--fixed{position:fixed}.mdc-menu-surface--fullwidth{width:100%}.mdc-menu-surface{max-width:calc(100vw - 32px);max-width:var(--mdc-menu-max-width, calc(100vw - 32px));max-height:calc(100vh - 32px);max-height:var(--mdc-menu-max-height, calc(100vh - 32px));z-index:8;border-radius:4px;border-radius:var(--mdc-shape-medium, 4px)}.mat-mdc-select{display:inline-block;width:100%;outline:none}.mat-mdc-select-trigger{display:inline-flex;align-items:center;cursor:pointer;position:relative;box-sizing:border-box;width:100%}.mat-mdc-select-disabled .mat-mdc-select-trigger{-webkit-user-select:none;user-select:none;cursor:default}.mat-mdc-select-value{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mat-mdc-select-value-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mat-mdc-select-arrow-wrapper{height:24px;flex-shrink:0;display:inline-flex;align-items:center}.mat-form-field-appearance-fill .mat-mdc-select-arrow-wrapper{transform:translateY(-8px)}.mat-form-field-appearance-fill .mdc-text-field--no-label .mat-mdc-select-arrow-wrapper{transform:none}.mat-mdc-select-arrow{width:10px;height:5px;position:relative}.mat-mdc-select-arrow svg{fill:currentColor;position:absolute;top:50%;left:50%;transform:translate(-50%, -50%)}.cdk-high-contrast-active .mat-mdc-select-arrow svg{fill:CanvasText}.mat-mdc-select-disabled .cdk-high-contrast-active .mat-mdc-select-arrow svg{fill:GrayText}.mdc-menu-surface.mat-mdc-select-panel{width:100%;max-height:275px;position:static;outline:0;margin:0;padding:8px 0;list-style-type:none}.mdc-menu-surface.mat-mdc-select-panel:focus{outline:none}.cdk-high-contrast-active .mdc-menu-surface.mat-mdc-select-panel{outline:solid 1px}.cdk-overlay-pane:not(.mat-mdc-select-panel-above) .mdc-menu-surface.mat-mdc-select-panel{border-top-left-radius:0;border-top-right-radius:0;transform-origin:top center}.mat-mdc-select-panel-above .mdc-menu-surface.mat-mdc-select-panel{border-bottom-left-radius:0;border-bottom-right-radius:0;transform-origin:bottom center}.mat-mdc-select-placeholder{transition:color 400ms 133.3333333333ms cubic-bezier(0.25, 0.8, 0.25, 1)}._mat-animation-noopable .mat-mdc-select-placeholder{transition:none}.mat-form-field-hide-placeholder .mat-mdc-select-placeholder{color:rgba(0,0,0,0);-webkit-text-fill-color:rgba(0,0,0,0);transition:none;display:block}.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-fill .mat-mdc-floating-label{max-width:calc(100% - 18px)}.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-fill .mdc-floating-label--float-above{max-width:calc(100% / 0.75 - 24px)}.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-outline .mdc-notched-outline__notch{max-width:calc(100% - 60px)}.mat-mdc-form-field-type-mat-select.mat-form-field-appearance-outline .mdc-text-field--label-floating .mdc-notched-outline__notch{max-width:calc(100% - 24px)}.mat-mdc-select-min-line:empty::before{content:" ";white-space:pre;width:1px;display:inline-block;visibility:hidden}'],encapsulation:2,data:{animation:[oe.transformPanel]},changeDetection:0})}return o})(),fe=(()=>{class o{static#e=this.\u0275fac=function(i){return new(i||o)};static#t=this.\u0275mod=t.oAB({type:o});static#i=this.\u0275inj=t.cJS({providers:[he],imports:[f.ez,c.U8,_.Ng,_.BQ,I.ZD,E.lN,_.Ng,_.BQ]})}return o})()},2982:(L,M,u)=>{u.d(M,{Tm:()=>T,i3:()=>F});var c=u(5879),f=u(6814);const t=["video"],_=["canvas"];function E(h,b){if(1&h){const s=c.EpF();c.TgZ(0,"div",6),c.NdJ("click",function(){c.CHM(s);const p=c.oxw();return c.KtG(p.rotateVideoInput(!0))}),c.qZA()}}class I{constructor(b,s,l){this._mimeType=null,this._imageAsBase64=null,this._imageAsDataUrl=null,this._imageData=null,this._mimeType=s,this._imageAsDataUrl=b,this._imageData=l}static getDataFromDataUrl(b,s){return b.replace(`data:${s};base64,`,"")}get imageAsBase64(){return this._imageAsBase64?this._imageAsBase64:this._imageAsBase64=I.getDataFromDataUrl(this._imageAsDataUrl,this._mimeType)}get imageAsDataUrl(){return this._imageAsDataUrl}get imageData(){return this._imageData}}class R{static getAvailableVideoInputs(){return navigator.mediaDevices&&navigator.mediaDevices.enumerateDevices?new Promise((b,s)=>{navigator.mediaDevices.enumerateDevices().then(l=>{b(l.filter(p=>"videoinput"===p.kind))}).catch(l=>{s(l.message||l)})}):Promise.reject("enumerateDevices() not supported.")}}let F=(()=>{class h{constructor(){this.width=640,this.height=480,this.videoOptions=h.DEFAULT_VIDEO_OPTIONS,this.allowCameraSwitch=!0,this.captureImageData=!1,this.imageType=h.DEFAULT_IMAGE_TYPE,this.imageQuality=h.DEFAULT_IMAGE_QUALITY,this.imageCapture=new c.vpe,this.initError=new c.vpe,this.imageClick=new c.vpe,this.cameraSwitched=new c.vpe,this.availableVideoInputs=[],this.videoInitialized=!1,this.activeVideoInputIndex=-1,this.mediaStream=null,this.activeVideoSettings=null}set trigger(s){this.triggerSubscription&&this.triggerSubscription.unsubscribe(),this.triggerSubscription=s.subscribe(()=>{this.takeSnapshot()})}set switchCamera(s){this.switchCameraSubscription&&this.switchCameraSubscription.unsubscribe(),this.switchCameraSubscription=s.subscribe(l=>{"string"==typeof l?this.switchToVideoInput(l):this.rotateVideoInput(!1!==l)})}static getMediaConstraintsForDevice(s,l){const p=l||this.DEFAULT_VIDEO_OPTIONS;return s&&(p.deviceId={exact:s}),p}static getDeviceIdFromMediaStreamTrack(s){if(s.getSettings&&s.getSettings()&&s.getSettings().deviceId)return s.getSettings().deviceId;if(s.getConstraints&&s.getConstraints()&&s.getConstraints().deviceId){const l=s.getConstraints().deviceId;return h.getValueFromConstrainDOMString(l)}}static getFacingModeFromMediaStreamTrack(s){if(s){if(s.getSettings&&s.getSettings()&&s.getSettings().facingMode)return s.getSettings().facingMode;if(s.getConstraints&&s.getConstraints()&&s.getConstraints().facingMode){const l=s.getConstraints().facingMode;return h.getValueFromConstrainDOMString(l)}}}static isUserFacing(s){const l=h.getFacingModeFromMediaStreamTrack(s);return!!l&&"user"===l.toLowerCase()}static getValueFromConstrainDOMString(s){if(s){if(s instanceof String)return String(s);if(Array.isArray(s)&&Array(s).length>0)return String(s[0]);if("object"==typeof s){if(s.exact)return String(s.exact);if(s.ideal)return String(s.ideal)}}return null}ngAfterViewInit(){this.detectAvailableDevices().then(()=>{this.switchToVideoInput(null)}).catch(s=>{this.initError.next({message:s}),this.switchToVideoInput(null)})}ngOnDestroy(){this.stopMediaTracks(),this.unsubscribeFromSubscriptions()}takeSnapshot(){const s=this.nativeVideoElement,l={width:this.width,height:this.height};s.videoWidth&&(l.width=s.videoWidth,l.height=s.videoHeight);const p=this.canvas.nativeElement;p.width=l.width,p.height=l.height;const V=p.getContext("2d");V.drawImage(s,0,0);const C=this.imageType?this.imageType:h.DEFAULT_IMAGE_TYPE,O=p.toDataURL(C,this.imageQuality?this.imageQuality:h.DEFAULT_IMAGE_QUALITY);let P=null;this.captureImageData&&(P=V.getImageData(0,0,p.width,p.height)),this.imageCapture.next(new I(O,C,P))}rotateVideoInput(s){this.availableVideoInputs&&this.availableVideoInputs.length>1&&this.switchToVideoInput(this.availableVideoInputs[(this.activeVideoInputIndex+(s?1:this.availableVideoInputs.length-1))%this.availableVideoInputs.length].deviceId)}switchToVideoInput(s){this.videoInitialized=!1,this.stopMediaTracks(),this.initWebcam(s,this.videoOptions)}videoResize(){}get videoWidth(){const s=this.getVideoAspectRatio();return Math.min(this.width,this.height*s)}get videoHeight(){const s=this.getVideoAspectRatio();return Math.min(this.height,this.width/s)}get videoStyleClasses(){let s="";return this.isMirrorImage()&&(s+="mirrored "),s.trim()}get nativeVideoElement(){return this.video.nativeElement}getVideoAspectRatio(){const s=this.nativeVideoElement;return s.videoWidth&&s.videoWidth>0&&s.videoHeight&&s.videoHeight>0?s.videoWidth/s.videoHeight:this.width/this.height}initWebcam(s,l){const p=this.nativeVideoElement;if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){const V=h.getMediaConstraintsForDevice(s,l);navigator.mediaDevices.getUserMedia({video:V}).then(C=>{this.mediaStream=C,p.srcObject=C,p.play(),this.activeVideoSettings=C.getVideoTracks()[0].getSettings();const m=h.getDeviceIdFromMediaStreamTrack(C.getVideoTracks()[0]);this.cameraSwitched.next(m),this.detectAvailableDevices().then(()=>{this.activeVideoInputIndex=m?this.availableVideoInputs.findIndex(O=>O.deviceId===m):-1,this.videoInitialized=!0}).catch(()=>{this.activeVideoInputIndex=-1,this.videoInitialized=!0})}).catch(C=>{this.initError.next({message:C.message,mediaStreamError:C})})}else this.initError.next({message:"Cannot read UserMedia from MediaDevices."})}getActiveVideoTrack(){return this.mediaStream?this.mediaStream.getVideoTracks()[0]:null}isMirrorImage(){if(!this.getActiveVideoTrack())return!1;{let s="auto";switch(this.mirrorImage&&("string"==typeof this.mirrorImage?s=String(this.mirrorImage).toLowerCase():this.mirrorImage.x&&(s=this.mirrorImage.x.toLowerCase())),s){case"always":return!0;case"never":return!1}}return h.isUserFacing(this.getActiveVideoTrack())}stopMediaTracks(){this.mediaStream&&this.mediaStream.getTracks&&(this.nativeVideoElement.pause(),this.mediaStream.getTracks().forEach(s=>s.stop()))}unsubscribeFromSubscriptions(){this.triggerSubscription&&this.triggerSubscription.unsubscribe(),this.switchCameraSubscription&&this.switchCameraSubscription.unsubscribe()}detectAvailableDevices(){return new Promise((s,l)=>{R.getAvailableVideoInputs().then(p=>{this.availableVideoInputs=p,s(p)}).catch(p=>{this.availableVideoInputs=[],l(p)})})}}return h.DEFAULT_VIDEO_OPTIONS={facingMode:"environment"},h.DEFAULT_IMAGE_TYPE="image/jpeg",h.DEFAULT_IMAGE_QUALITY=.92,h.\u0275fac=function(s){return new(s||h)},h.\u0275cmp=c.Xpm({type:h,selectors:[["webcam"]],viewQuery:function(s,l){if(1&s&&(c.Gf(t,7),c.Gf(_,7)),2&s){let p;c.iGM(p=c.CRH())&&(l.video=p.first),c.iGM(p=c.CRH())&&(l.canvas=p.first)}},inputs:{width:"width",height:"height",videoOptions:"videoOptions",allowCameraSwitch:"allowCameraSwitch",mirrorImage:"mirrorImage",captureImageData:"captureImageData",imageType:"imageType",imageQuality:"imageQuality",trigger:"trigger",switchCamera:"switchCamera"},outputs:{imageCapture:"imageCapture",initError:"initError",imageClick:"imageClick",cameraSwitched:"cameraSwitched"},decls:6,vars:7,consts:[[1,"webcam-wrapper",3,"click"],["autoplay","","muted","","playsinline","",3,"width","height","resize"],["video",""],["class","camera-switch",3,"click",4,"ngIf"],[3,"width","height"],["canvas",""],[1,"camera-switch",3,"click"]],template:function(s,l){1&s&&(c.TgZ(0,"div",0),c.NdJ("click",function(){return l.imageClick.next()}),c.TgZ(1,"video",1,2),c.NdJ("resize",function(){return l.videoResize()}),c.qZA(),c.YNc(3,E,1,0,"div",3),c._UZ(4,"canvas",4,5),c.qZA()),2&s&&(c.xp6(1),c.Tol(l.videoStyleClasses),c.Q6J("width",l.videoWidth)("height",l.videoHeight),c.xp6(2),c.Q6J("ngIf",l.allowCameraSwitch&&l.availableVideoInputs.length>1&&l.videoInitialized),c.xp6(1),c.Q6J("width",l.width)("height",l.height))},dependencies:[f.O5],styles:[".webcam-wrapper[_ngcontent-%COMP%]{display:inline-block;position:relative;line-height:0}.webcam-wrapper[_ngcontent-%COMP%]   video.mirrored[_ngcontent-%COMP%]{transform:scaleX(-1)}.webcam-wrapper[_ngcontent-%COMP%]   canvas[_ngcontent-%COMP%]{display:none}.webcam-wrapper[_ngcontent-%COMP%]   .camera-switch[_ngcontent-%COMP%]{background-color:#0000001a;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAE9UlEQVR42u2aT2hdRRTGf+cRQqghSqihdBFDkRISK2KDfzDWxHaRQHEhaINKqa1gKQhd6EZLN+IidCH+Q0oWIkVRC21BQxXRitVaSbKoJSGtYGoK2tQ/tU1jY5v0c5F54Xl7b/KSO/PyEt+3e5f75p7zzZwzZ74zUEIJJfyfYaEGllQGVAGZlENdBy6Z2cSiYFTSKkkfS/pH/nBF0kFJdUW9AiRVASeAukD8DgNrzOySrwEzng18KaDzALXuG8W3AiStAvqBisBRNg40mtlPxbYCOgvgPO4bncWW+JpVeDQXRQhIygDfA00F5r0XuNfMrgclQFI98DDQCNQA5ZFXqoCWBVp8XwHRHeEqcN7loy/NbHBesyqpQ1KfFj/6nC+ZvFaApFrgPaCZpYVvgCfNbDiRAElNwGFg+RIt/X8H2s2s9wYCJDUAR4HqJX7++RN40MwGpgmQVAH0AQ2BPz4AHHPl8nBOAqtyFWQjsA6oL4Ada81sPDv7uwImod8kvSJp9RyS8O2SXnb/DYVd2Y9VSroQ4ANXJO2WVJmixqh0kzMWwL4LkiqRtDnA4D1zmfE8j9g9AezcnAHaPcfXdbfdnPZ2Yps6+DwAvO/Z1naTdApY7Xng48BDZnY1MpMVQBuw3iXc5Tnb0wBwBPjUzP6eoezuArZ6svM0geJLkvZEYnl3nkntoqROSbckSW2Suj3ZOIangc7GPJuUtNGdFIfmMeavktoSSKiW9LMPw30Q8JqkekmjCbOZRhuclLQjgYSNxUBAj6RyZ9ATgUJpUtJTCSR8vpAEXHAyWK5BXYFIGHOlepSAloUk4NEYgyoknQhEwhFJ0e8h6VSaQeerCb5uZgdi9utxYBNwOUD93hIVXswM4INCi6K9wAszFC2DwLOBDjHbYp59karIUnRdzYy/3ClqVklaUhfwTICj7K25OqA7a4wWagVsm4Me/xzwg2cCqqONFzO7DPxSCAJi436GUBgHHguQD2oTlJ55oSzP9ybccsttSJw1szdjFOSnI/8dTCGZHwcORp4Nx7y3B1iZ8/sm4MW8/Euxg5wIsS/HaAp3zeP4/G7obRDXI4jiTIA22H7Xdc7X+S3A5lC7QBQ357aq3VAjCeSkwUfAJrfvz+R8A9ADLAtZB+TinpjC5JMA+//jwPZZnF8G7J+L8z4IWB/zbG+gIujVWfLBW/NStVMmqaG4POJRsIjix7h8IGnLQuoBbQki5sVAJHyYm7YkNaRRtXwQ8G1cHpX0iKRrgUjYno17Sf0LrQhJUkdCeHWkVITGJI0k1QeS3ikGSUzOyJUJJNznYneuOCnpTldcxa2kP3xJYqOeSDjqZG8ShJLnE8TTuMS6Iyu1BW7djZqkfo9N0QOuYJmYQddfB7RG+gLTNzqAY9FrL+5/nwEbvDdJJe3zzOrhNP3AWRqmk55t3ZcBuj3b2gb0Sbrbo/NNzk7fFzu7s/E5EiC+rrmeQU0Kx2skvRFoOx2ZzlmSdgbsw49JetvtBpk8nM64d/cGbNtJ0s7cGyJlwHeEv+t3nqnLSgPAUOSGyG3AHUxdzqoJbEcvcL+ZTeTeEapzJKxgaeOcc/7Mf06D7kFrguS0VDAMtGadv+E47DT9tcChJej8ISfpD+abgTe45uOkFi8mnQ+JBVQ+d4VXuOptjavcyot8pq86mfwk8LWZnaOEEkoooYQSSojDv8AhQNeGfe0jAAAAAElFTkSuQmCC);background-repeat:no-repeat;border-radius:5px;position:absolute;right:13px;top:10px;height:48px;width:48px;background-size:80%;cursor:pointer;background-position:center;transition:background-color .2s ease}.webcam-wrapper[_ngcontent-%COMP%]   .camera-switch[_ngcontent-%COMP%]:hover{background-color:#0000002e}"]}),h})(),T=(()=>{class h{}return h.\u0275fac=function(s){return new(s||h)},h.\u0275mod=c.oAB({type:h}),h.\u0275inj=c.cJS({imports:[[f.ez]]}),h})()}}]);