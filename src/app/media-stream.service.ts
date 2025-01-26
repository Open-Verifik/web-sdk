import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class MediaStreamService {
    activeStreams: MediaStream[] = [];

    // set up a media stream and add it to the activeStreams array
    async startStream(
        constraints: MediaStreamConstraints
    ): Promise<MediaStream> {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        this.activeStreams.push(stream);

        return stream;
    }

    // just add Stream to activeStreams array
    addStream(stream: MediaStream): void {
        this.activeStreams.push(stream);
    }

    // stop a stream and remove it from the activeStreams array
    stopStream(stream: MediaStream): void {
        if (!this.activeStreams.includes(stream)) {
            return;
        }

        stream.getTracks().forEach((track) => track.stop());
        this.activeStreams = this.activeStreams.filter(
            (activeStream) => activeStream !== stream
        );
    }

    // stop all streams in the activeStreams array
    stopAllStreams(): void {
        if (!this.activeStreams.length) {
            return;
        }

        this.activeStreams.forEach((stream) => {
            stream?.getTracks().forEach((track) => track.stop());
        });

        this.activeStreams = [];
    }
}
