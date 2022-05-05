import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { TemplateResult } from 'lit/html.js';
import * as lottie from 'lottie-web/build/player/lottie_svg';
import JSZip from 'jszip/dist/jszip';

import styles from './dotlottie-player.styles';

// Define valid player states
export enum PlayerState {
  Loading = 'loading',
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Frozen = 'frozen',
  Error = 'error',
}

// Define play modes
export enum PlayMode {
  Normal = 'normal',
  Bounce = 'bounce',
}

// Define player events
export enum PlayerEvents {
  Load = 'load',
  Error = 'error',
  Ready = 'ready',
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  Freeze = 'freeze',
  Loop = 'loop',
  Complete = 'complete',
  Rendered = "rendered",
  Frame = 'frame',
}

// let _animIdx: number = 0;

/**
 * Load a resource from a path URL.
 */
// export function fetchPath(path: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     xhr.open('GET', path, true);
//     xhr.responseType = 'arraybuffer';
//     xhr.send();
//     xhr.onreadystatechange = function () {
//       if (xhr.readyState == 4 && xhr.status == 200) {
//         JSZip.loadAsync(xhr.response)
//           .then((zip: any) => {
//             zip
//               .file('manifest.json')
//               .async('string')
//               .then((manifestFile: string) => {
//                 const manifest = JSON.parse(manifestFile);

//                 if (!('animations' in manifest)) {
//                   throw new Error('Manifest not found');
//                 }

//                 if (manifest.animations.length === 0) {
//                   throw new Error('No animations listed in the manifest');
//                 }

//                 const defaultLottie = manifest.animations[_animIdx];

//                 if (!defaultLottie) {
//                   throw (`[dotLottie] Animation not found at index: ` + _animIdx);
//                 }
//                 try {
//                   zip
//                     .file(`animations/${defaultLottie.id}.json`)
//                     .async('string')
//                     .then((lottieFile: string) => {
//                       const lottieJson = JSON.parse(lottieFile);

//                       if ('assets' in lottieJson) {
//                         Promise.all(
//                           lottieJson.assets.map((asset: any) => {
//                             if (!asset.p) {
//                               return;
//                             }
//                             if (zip.file(`images/${asset.p}`) == null) {
//                               return;
//                             }

//                             return new Promise((resolveAsset: any) => {
//                               zip
//                                 .file(`images/${asset.p}`)
//                                 .async('base64')
//                                 .then((assetB64: any) => {
//                                   asset.p = 'data:;base64,' + assetB64;
//                                   asset.e = 1;

//                                   resolveAsset();
//                                 });
//                             });
//                           }),
//                         ).then(() => {
//                           resolve(lottieJson);
//                         });
//                       }
//                     });
//                 } catch (err) {
//                   throw (`[dotLottie] Error finding '${defaultLottie.id}' in .lottie file. Does your manifest contain the correct animation id?`);
//                 }
//               });
//           })
//           .catch((err: Error) => {
//             reject(err);
//           });
//       }
//     };
//   });
// }

/**
 * DotLottiePlayer web component class
 *
 * @export
 * @class DotLottiePlayer
 * @extends {LitElement}
 */
@customElement('dotlottie-player')
export class DotLottiePlayer extends LitElement {
  /**
   * Animation container.
   */
  @query('.animation')
  protected container!: HTMLElement;

  /**
   * Play mode.
   */
  @property()
  public mode: PlayMode = PlayMode.Normal;

  /**
   * Autoplay animation on load.
   */
  @property({ type: Boolean })
  public autoplay = false;

  /**
   * Background color.
   */
  @property({ type: String, reflect: true })
  public background?: string = 'transparent';

  /**
   * Show controls.
   */
  @property({ type: Boolean })
  public controls = false;

  /**
   * Number of times to loop animation.
   */
  @property({ type: Number })
  public count?: number;

  /**
   * Direction of animation.
   */
  @property({ type: Number })
  public direction = 1;

  /**
   * Whether to play on mouse hover
   */
  @property({ type: Boolean })
  public hover = false;

  /**
   * Whether to loop animation.
   */
  @property({ type: Boolean, reflect: true })
  public loop = false;

  /**
   * Renderer to use.
   */
  @property({ type: String })
  public renderer: 'svg' = 'svg';

  /**
   * Animation speed.
   */
  @property({ type: Number })
  public speed = 1;

  /**
   * Bodymovin JSON data or URL to JSON.
   */
  @property({ type: String })
  public src?: string;

  /**
  * Load and play desired animation first.
  */
  @property({ type: String })
  public animation?: string;

  /**
   * Player state.
   */
  @property({ type: String })
  public currentState: PlayerState = PlayerState.Loading;

  @property()
  public seeker: any;

  @property()
  public intermission = 1;

  private _io?: any;
  private _lottie?: any;
  private _prevState?: any;
  private _counter = 0;
  private _animIdx = 0;
  private _manifest: any;

  private fetchPath(path: string, index: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.responseType = 'arraybuffer';
      xhr.send();
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          JSZip.loadAsync(xhr.response)
            .then((zip: any) => {
              zip
                .file('manifest.json')
                .async('string')
                .then((manifestFile: string) => {
                  const manifest = JSON.parse(manifestFile);

                  if (!('animations' in manifest)) {
                    throw new Error('Manifest not found');
                  }

                  if (manifest.animations.length === 0) {
                    throw new Error('No animations listed in the manifest');
                  }

                  const defaultLottie = manifest.animations[index];
                  this._manifest = manifest;

                  if (!defaultLottie) {
                    throw (`[dotLottie] Animation not found at index: ` + index);
                  }
                  try {
                    zip
                      .file(`animations/${defaultLottie.id}.json`)
                      .async('string')
                      .then((lottieFile: string) => {
                        const lottieJson = JSON.parse(lottieFile);

                        if ('assets' in lottieJson) {
                          Promise.all(
                            lottieJson.assets.map((asset: any) => {
                              if (!asset.p) {
                                return;
                              }
                              if (zip.file(`images/${asset.p}`) == null) {
                                return;
                              }

                              return new Promise((resolveAsset: any) => {
                                zip
                                  .file(`images/${asset.p}`)
                                  .async('base64')
                                  .then((assetB64: any) => {
                                    asset.p = 'data:;base64,' + assetB64;
                                    asset.e = 1;

                                    resolveAsset();
                                  });
                              });
                            }),
                          ).then(() => {
                            resolve(lottieJson);
                          });
                        }
                      });
                  } catch (err) {
                    throw (`[dotLottie] Error finding '${defaultLottie.id}' in .lottie file. Does your manifest contain the correct animation id?`);
                  }
                });
            })
            .catch((err: Error) => {
              reject(err);
            });
        } else if (xhr.readyState === 4 && xhr.status === 0) {
          reject(`[dotLottie] Error finding dotLottie file at ${path}`);
        }
      };
    });
  }

  /**
   * Handle visibility change events.
   */
  private _onVisibilityChange(): void {
    if (document.hidden && this.currentState === PlayerState.Playing) {
      this.freeze();
    } else if (this.currentState === PlayerState.Frozen) {
      this.play();
    }
  }

  /**
   * Handles click and drag actions on the progress track.
   */
  private _handleSeekChange(e: any): void {
    if (!this._lottie || isNaN(e.target.value)) {
      return;
    }

    const frame: number = (e.target.value / 100) * this._lottie.totalFrames;

    this.seek(frame);
  }

  /**
   * Configure and initialize lottie-web player instance.
   */
  public async load(src: string): Promise<void> {
    if (!this.shadowRoot) {
      return;
    }

    const options: any = {
      container: this.container,
      loop: false,
      autoplay: false,
      renderer: this.renderer,
      rendererSettings: {
        scaleMode: 'noScale',
        clearCanvas: false,
        progressiveLoad: true,
        hideOnTransparent: true,
      },
    };

    // Load the resource information
    try {
      const srcParsed = await this.fetchPath(src, this._animIdx);

      // Clear previous animation, if any
      if (this._lottie) {
        this._lottie.destroy();
      }

      // Initialize lottie player and load animation
      this._lottie = lottie.loadAnimation({
        ...options,
        animationData: srcParsed,
      });
    } catch (err) {
      console.error(err);

      this.currentState = PlayerState.Error;
      this.dispatchEvent(new CustomEvent(PlayerEvents.Error));
      return;
    }

    if (this._lottie) {
      // Calculate and save the current progress of the animation
      this._lottie.addEventListener('enterFrame', () => {
        this.seeker = (this._lottie.currentFrame / this._lottie.totalFrames) * 100;

        this.dispatchEvent(
          new CustomEvent(PlayerEvents.Frame, {
            detail: {
              frame: this._lottie.currentFrame,
              seeker: this.seeker,
            },
          }),
        );
      });

      // Handle animation play complete
      this._lottie.addEventListener('complete', () => {
        if (this.currentState !== PlayerState.Playing) {
          this.dispatchEvent(new CustomEvent(PlayerEvents.Complete));
          return;
        }
        if (!this.loop || (this.count && this._counter >= this.count)) {
          this.dispatchEvent(new CustomEvent(PlayerEvents.Complete));

          if (this.mode === PlayMode.Bounce) {
            if (this._lottie.currentFrame === 0) {
              return;
            }
          } else {
            return;
          }
        }

        if (this.mode === PlayMode.Bounce) {
          if (this.count) {
            this._counter += 0.5;
          }

          setTimeout(() => {
            this.dispatchEvent(new CustomEvent(PlayerEvents.Loop));

            if (this.currentState === PlayerState.Playing) {
              this._lottie.setDirection(this._lottie.playDirection * -1);
              this._lottie.play();
            }
          }, this.intermission);
        } else {
          if (this.count) {
            this._counter += 1;
          }

          window.setTimeout(() => {
            this.dispatchEvent(new CustomEvent(PlayerEvents.Loop));

            if (this.currentState === PlayerState.Playing) {
              if (this.direction === -1) {
                // Prevents flickering
                this.seek("99%");
                this.play();
              } else {
                this._lottie.stop();
                this._lottie.play();
              }
            }
          }, this.intermission);
        }
      });

      // Handle lottie-web ready event
      this._lottie.addEventListener('DOMLoaded', () => {
        this.dispatchEvent(new CustomEvent(PlayerEvents.Ready));
      });

      // Handle animation data load complete
      this._lottie.addEventListener('data_ready', () => {
        this.dispatchEvent(new CustomEvent(PlayerEvents.Load));
      });

      // Set error state when animation load fail event triggers
      this._lottie.addEventListener('data_failed', () => {
        this.currentState = PlayerState.Error;

        this.dispatchEvent(new CustomEvent(PlayerEvents.Error));
      });

      // Set handlers to auto play animation on hover if enabled
      this.container.addEventListener('mouseenter', () => {
        if (this.hover && this.currentState !== PlayerState.Playing) {
          this.play();
        }
      });
      this.container.addEventListener('mouseleave', () => {
        if (this.hover && this.currentState === PlayerState.Playing) {
          this.stop();
        }
      });

      // Set initial playback speed and direction
      this.setSpeed(this.speed);
      this.setDirection(this.direction);

      // Start playing if autoplay is enabled
      if (this.autoplay) {
        this.play();
      }
    }
  }

  /**
   * dotLottie files can contain multiple animations
   * this method loads the animation from the desired index.
   */
  public async loadAtIndex(index: number): Promise<void> {
    this._animIdx = index;

    if (this.src) {
      this.destroyCurrentAnimation();
      await this.load(this.src);
    }
  }

  /**
 * dotLottie files can contain multiple animations
 * this method loads the animation from the desired id.
 */
  public async loadAtId(id: string): Promise<void> {
    let i = 0;
    let found = false;

    try {
      // We need a manifest to check if desired animation is present
      if (!this._manifest) {
        if (this.src)
          await this.fetchPath(this.src, this._animIdx);
        else
          return;
      }

      this._manifest.animations.forEach((element: { id: string; }) => {
        if (element.id === id) {
          this._animIdx = i;
          found = true;
        }
        i++;
      });
      if (found) {
        this.destroyCurrentAnimation();
        if (this.src) {
          return this.load(this.src);
        }
      } else {
        throw (`[dotLottie] No animation with the id '${id}' was found.`);
      }
    } catch (e) {
      console.error(e);
      this.currentState = PlayerState.Error;

      this.dispatchEvent(new CustomEvent(PlayerEvents.Error));
      return;
    }
  }

  /**
   * Returns the lottie-web instance used in the component.
   */
  public getLottie(): any {
    return this._lottie;
  }

  /**
   * Start playing animation.
   */
  public play() {
    if (!this._lottie) {
      return;
    }

    this._lottie.play();
    this.currentState = PlayerState.Playing;

    this.dispatchEvent(new CustomEvent(PlayerEvents.Play));
  }

  /**
   * Pause animation play.
   */
  public pause(): void {
    if (!this._lottie) {
      return;
    }

    this._lottie.pause();
    this.currentState = PlayerState.Paused;

    this.dispatchEvent(new CustomEvent(PlayerEvents.Pause));
  }

  /**
   * Stops current animation, removes listeners and destroy() it
   */
  private destroyCurrentAnimation(): void {
    this.stop();

    // this.player.removeEventListener()
    // this.container.removeEventListener()

    if (this._lottie)
      this._lottie.destroy();
    this._lottie = null;
  }

  /**
   * Stops animation play.
   */
  public stop(): void {
    if (!this._lottie) {
      return;
    }

    this._counter = 0;
    this._lottie.stop();
    this.currentState = PlayerState.Stopped;

    this.dispatchEvent(new CustomEvent(PlayerEvents.Stop));
  }

  /**
    * Seek to a given frame.
    */
  public seek(value: number | string): void {
    if (!this._lottie) {
      return;
    }

    // Extract frame number from either number or percentage value
    const matches = /^(\d+)(%?)$/.exec(value.toString());

    if (!matches) {
      return;
    }

    // Calculate and set the frame number
    const frame =
      matches[2] === "%"
        ? (this._lottie.totalFrames * Number(matches[1])) / 100
        : Number(matches[1]);

    // Set seeker to new frame number
    this.seeker = frame;

    // Send lottie player to the new frame
    if (this.currentState === PlayerState.Playing) {
      this._lottie.goToAndPlay(frame, true);
    } else {
      this._lottie.goToAndStop(frame, true);
      this._lottie.pause();
    }
  }

  /**
   * Snapshot the current frame as SVG.
   *
   * If 'download' argument is boolean true, then a download is triggered in browser.
   */
  public snapshot(download = true): string | void {
    if (!this.shadowRoot) return;

    // Get SVG element and serialize markup
    const svgElement = this.shadowRoot.querySelector('.animation svg') as Node;
    const data = new XMLSerializer().serializeToString(svgElement);

    // Trigger file download
    if (download) {
      const element = document.createElement('a');
      element.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data);
      element.download = 'download_' + this.seeker + '.svg';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }

    return data;
  }

  /**
   * Freeze animation play.
   * This internal state pauses animation and is used to differentiate between
   * user requested pauses and component instigated pauses.
   */
  private freeze(): void {
    if (!this._lottie) {
      return;
    }

    this._lottie.pause();
    this.currentState = PlayerState.Frozen;

    this.dispatchEvent(new CustomEvent(PlayerEvents.Freeze));
  }

  /**
   * Sets animation play speed.
   *
   * @param value Playback speed.
   */
  public setSpeed(value = 1): void {
    if (!this._lottie) {
      return;
    }

    this._lottie.setSpeed(value);
  }

  /**
   * Animation play direction.
   *
   * @param value Direction values.
   */
  public setDirection(value: number): void {
    if (!this._lottie) {
      return;
    }

    this._lottie.setDirection(value);
  }

  /**
   * Get current animation's index
   */
  public getAnimationIndex(): number {
    return (this._animIdx);
  }

  /**
   * Sets the looping of the animation.
   *
   * @param value Whether to enable looping. Boolean true enables looping.
   */
  public setLooping(value: boolean): void {
    if (this._lottie) {
      this.loop = value;
      this._lottie.loop = value;
    }
  }

  /**
   * Toggle playing state.
   */
  public togglePlay(): void {
    return this.currentState === PlayerState.Playing ? this.pause() : this.play();
  }

  /**
   * Toggles animation looping.
   */
  public toggleLooping(): void {
    this.setLooping(!this.loop);
  }

  /**
   * Returns the styles for the component.
   */
  static get styles() {
    return styles;
  }

  /**
   * Initialize everything on component first render.
   */
  protected async firstUpdated(): Promise<void> {
    // Add intersection observer for detecting component being out-of-view.
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting) {
          if (this.currentState === PlayerState.Frozen) {
            this.play();
          }
        } else if (this.currentState === PlayerState.Playing) {
          this.freeze();
        }
      });

      this._io.observe(this.container);
    }

    // Add listener for Visibility API's change event.
    if (typeof document.hidden !== 'undefined') {
      document.addEventListener('visibilitychange', () => this._onVisibilityChange());
    }

    // Setup lottie player, if animation attribute is present, load animation
    // with that id first
    if (this.src && this.animation) {
      await this.loadAtId(this.animation);
    } else if (this.src) {
      await this.load(this.src);
    }
    this.dispatchEvent(new CustomEvent(PlayerEvents.Rendered));
  }

  /**
   * Cleanup on component destroy.
   */
  public disconnectedCallback(): void {
    // Remove intersection observer for detecting component being out-of-view.
    if (this._io) {
      this._io.disconnect();
      this._io = undefined;
    }

    // Remove the attached Visibility API's change event listener.
    document.removeEventListener('visibilitychange', () => this._onVisibilityChange());
  }

  protected renderControls() {
    const isPlaying: boolean = this.currentState === PlayerState.Playing;
    const isPaused: boolean = this.currentState === PlayerState.Paused;
    const isStopped: boolean = this.currentState === PlayerState.Stopped;

    return html`
      <div id="lottie-controls" aria-label="lottie-animation-controls" class="toolbar">
        <button
          id="lottie-play-button"
          @click=${this.togglePlay}
          class=${isPlaying || isPaused ? 'active' : ''}
          style="align-items:center;"
          tabindex="0"
          aria-label="play-pause"
        >
          ${isPlaying
        ? html`
                <svg width="24" height="24" aria-hidden="true" focusable="false">
                  <path d="M14.016 5.016H18v13.969h-3.984V5.016zM6 18.984V5.015h3.984v13.969H6z" />
                </svg>
              `
        : html`
                <svg width="24" height="24" aria-hidden="true" focusable="false">
                  <path d="M8.016 5.016L18.985 12 8.016 18.984V5.015z" />
                </svg>
              `}
        </button>
        <button
          id="lottie-stop-button"
          @click=${this.stop}
          class=${isStopped ? 'active' : ''}
          style="align-items:center;"
          tabindex="0"
          aria-label="stop"
        >
          <svg width="24" height="24" aria-hidden="true" focusable="false">
            <path d="M6 6h12v12H6V6z" />
          </svg>
        </button>
        <input
          id="lottie-seeker-input"
          class="seeker"
          type="range"
          min="0"
          step="1"
          max="100"
          .value=${this.seeker}
          @input=${this._handleSeekChange}
          @mousedown=${() => {
        this._prevState = this.currentState;
        this.freeze();
      }}
          @mouseup=${() => {
        this._prevState === PlayerState.Playing && this.play();
      }}
          aria-valuemin="1"
          aria-valuemax="100"
          role="slider"
          aria-valuenow=${this.seeker}
          tabindex="0"
          aria-label="lottie-seek-input"
        />
        <button
          id="lottie-loop-toggle"
          @click=${this.toggleLooping}
          class=${this.loop ? 'active' : ''}
          style="align-items:center;"
          tabindex="0"
          aria-label="loop-toggle"
        >
          <svg width="24" height="24" aria-hidden="true" focusable="false">
            <path
              d="M17.016 17.016v-4.031h1.969v6h-12v3l-3.984-3.984 3.984-3.984v3h10.031zM6.984 6.984v4.031H5.015v-6h12v-3l3.984 3.984-3.984 3.984v-3H6.984z"
            />
          </svg>
        </button>
      </div>
    `;
  }

  render(): TemplateResult | void {
    const className: string = this.controls ? 'main controls' : 'main';
    const animationClass: string = this.controls ? 'animation controls' : 'animation';
    return html`
      <div id="animation-container" class=${className} lang="en" role="img">
        <div id="animation" class=${animationClass} style="background:${this.background};">
          ${this.currentState === PlayerState.Error
        ? html`
                <div class="error">⚠️</div>
              `
        : undefined}
        </div>
        ${this.controls ? this.renderControls() : undefined}
      </div>
    `;
  }
}
