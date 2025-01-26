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

        console.log('Stream started and added to activeStreams array', {
            stream,
        });

        return stream;
    }

    // just add Stream to activeStreams array
    addStream(stream: MediaStream): void {
        console.log('Stream added to activeStreams array', { stream });
        this.activeStreams.push(stream);

        console.log('addStream: Stream added to activeStreams array', {
            stream,
        });
    }

    // stop a stream and remove it from the activeStreams array
    stopStream(stream: MediaStream): void {
        stream.getTracks().forEach((track) => track.stop());
        this.activeStreams = this.activeStreams.filter(
            (activeStream) => activeStream !== stream
        );

        console.log('Stream stopped and removed from activeStreams array', {
            stream,
        });
    }

    // stop all streams in the activeStreams array
    stopAllStreams(): void {
        this.activeStreams.forEach((stream) => {
            stream?.getTracks().forEach((track) => track.stop());
        });

        this.activeStreams = [];

        console.log('All streams stopped', {
            activeStreams: this.activeStreams,
        });
    }
}
