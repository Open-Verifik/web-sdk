import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-billing",
  templateUrl: "./billing.component.html",
  styleUrls: ["./billing.component.scss"],
})
export class BillingComponent implements OnInit {
  /**
   * Constructor
   */
  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _router: Router
  ) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this._changeDetectorRef.markForCheck();
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {}

  generalInfo(): void {
    this._router.navigate(["/billing/general"]);
  }
  paymentRecord(): void {
    this._router.navigate(["/billing/historial"]);
  }
  paymentMethods(): void {
    this._router.navigate(["/billing/metodos"]);
  }
  preferences(): void {
    this._router.navigate(["/billing/preferencias"]);
  }
}
