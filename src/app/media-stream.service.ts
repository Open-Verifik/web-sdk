import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class MediaStreamService {
    activeStreams: MediaStream[] = [];

    async startStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        this.activeStreams.push(stream);

        return stream;
    }

    addStream(stream: MediaStream): void {
        this.activeStreams.push(stream);
    }

    stopStream(stream: MediaStream): void {
        stream.getTracks().forEach((track) => track.stop());
        this.activeStreams = this.activeStreams.filter((activeStream) => activeStream !== stream);
    }

    stopAllStreams(): void {
        this.activeStreams.forEach((stream) => {
            stream?.getTracks().forEach((track) => track.stop());
        });

        this.activeStreams = [];
    }
}
