import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class MediaStreamService {
    async stopAllStreams() {
        console.log('Stopping all media streams...');
        const allStreams = new Set<MediaStreamTrack>();

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            for (const device of devices) {
                if (device.kind === 'videoinput') {
                    try {
                        const stream =
                            await navigator.mediaDevices.getUserMedia({
                                audio: false,
                                video: device.kind === 'videoinput',
                            });
                        stream.getTracks().forEach((track) => {
                            allStreams.add(track);
                            track.stop();
                        });
                    } catch (err) {
                        console.warn('Error accessing media devices:', err);
                    }
                }
            }
        } catch (err) {
            console.warn('Error enumerating devices:', err);
        }

        console.log(`Stopped ${allStreams.size} media tracks.`);
    }
}
