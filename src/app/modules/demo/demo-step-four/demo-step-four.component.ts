import { Component, OnInit } from "@angular/core";
import { FlexLayoutModule } from "@angular/flex-layout";
import { StepperComponent } from "../stepper/stepper.component";
import { DemoService } from "../demo.service";
import { MatButtonModule } from "@angular/material/button";
import { FaceComponent } from "app/modules/web-sdk/face/face.component";

@Component({
	selector: "demo-step-four",
	templateUrl: "./demo-step-four.component.html",
	styleUrls: ["./demo-step-four.component.scss", "../demo-root/demo-root.component.scss"],
	standalone: true,
	imports: [FlexLayoutModule, StepperComponent, MatButtonModule, FaceComponent],
})
export class DemoStepFourComponent implements OnInit {
	demoData: any;

	constructor(private _demoService: DemoService) {
		localStorage.removeItem("liveness");

		localStorage.removeItem("livenessResult");

		this.demoData = this._demoService.getDemoData();

		this.demoData.liveness = {};

		this.demoData.livenessResult = [];
	}

	ngOnInit(): void {}

	goBack(): void {
		this._demoService.moveToStep(3);
	}

	continue(): void {
		const fakeImage = `https://cdn.verifik.co/caras/0Crle8kqMPSRLHONED.jpg`;

		this._demoService
			.sendSelfie({
				os: "DESKTOP",
				image: fakeImage,
				// collection_id: "demo",
			})
			.subscribe((response) => {
				if (!response.data.result.passed) {
					alert("liveness did not pass, score: " + response.data.result.liveness_score);
					return;
				}

				this._demoService.setDemoLiveness(response.data);

				this._compareDocument();
			});
	}

	_compareDocument(): void {
		this._demoService
			.compareDocumentWithSelfie({
				search_mode: "FAST",
				gallery: [this.demoData.document.url],
				probe: [this.demoData.liveness.images[0]],
			})
			.subscribe(
				(compareResponse) => {
					console.log({ compareResponse });
					this._demoService.moveToStep(5);
				},
				(error) => {}
			);
	}
}
