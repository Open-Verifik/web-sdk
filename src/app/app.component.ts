import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { VerifikEmbedBridgeService } from "app/core/embed/verifik-embed-bridge.service";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    standalone: true,
    imports: [RouterOutlet],
})
export class AppComponent {
    constructor(private _embedBridge: VerifikEmbedBridgeService) {
        this._embedBridge.initFromWindowLocation();
    }
}
