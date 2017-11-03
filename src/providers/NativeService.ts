import { Injectable, NgZone } from '@angular/core';
import { Platform, AlertController, ToastController } from 'ionic-angular';
import { CodePush, SyncStatus } from '@ionic-native/code-push';
import { Network } from '@ionic-native/network';
import { AppVersion } from '@ionic-native/app-version';
import { Toast, ToastOptions } from '@ionic-native/toast';
import { Storage } from '@ionic/storage';
import { CODE_PUSH_DEPLOYMENT_KEY, ENV } from './Constants';

@Injectable()
export class NativeService {
    appDetail: any;
    messageText: string;

    constructor(
        private platform: Platform,
        private toast: Toast,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController,
        private codePush: CodePush,
        private ngZone: NgZone,
        private network: Network,
        private appVersion: AppVersion,
        private storage: Storage,
    ) {
    }

    warn(info): void {
        console.log('%cNativeService/' + info, 'color:#e8c406');
    }

    /**
   * 获得app版本号,如0.01
   * @description  对应/config.xml中version的值
   * @returns {Promise<string>}
   */
    getVersionNumber(): Promise<string> {
        return new Promise((resolve) => {
            this.appVersion.getVersionNumber().then((value: string) => {
                resolve(value);
            }).catch(err => {
                this.warn('getVersionNumber:' + err);
            });
        });
    }

    /**
   * 获取网络类型 如`unknown`, `ethernet`, `wifi`, `2g`, `3g`, `4g`, `cellular`, `none`
   */
    getNetworkType(): string {
        if (!this.isMobile()) {
            return 'wifi';
        }
        return this.network.type;
    }

    /**
     * 判断是否有网络
     * @returns {boolean}
     */
    isConnecting(): boolean {
        return this.getNetworkType() !== 'none';
    }

    /**
     * 是否真机环境
     * @return {boolean}
     */
    isMobile(): boolean {
        return this.platform.is('mobile') && !this.platform.is('mobileweb');
    }

    /**
     * 是否android真机环境
     * @return {boolean}
     */
    isAndroid(): boolean {
        return this.isMobile() && this.platform.is('android');
    }

    /**
     * 是否ios真机环境
     * @return {boolean}
     */
    isIos(): boolean {
        return this.isMobile() && (this.platform.is('ios') || this.platform.is('ipad') || this.platform.is('iphone'));
    }

    /**
     * code push
     */
    codePushReady() {
        if (!this.isMobile()) {
            return;
        }
        let deploymentKey = '';
        if (this.isAndroid() && ENV !== 'prod') {
            deploymentKey = CODE_PUSH_DEPLOYMENT_KEY.android.Staging;
        }
        if (this.isAndroid() && ENV === 'prod') {
            deploymentKey = CODE_PUSH_DEPLOYMENT_KEY.android.Production;
        }
        if (this.isIos() && ENV !== 'prod') {
            deploymentKey = CODE_PUSH_DEPLOYMENT_KEY.ios.Staging;
        }
        if (this.isIos() && ENV === 'prod') {
            deploymentKey = CODE_PUSH_DEPLOYMENT_KEY.ios.Production;
        }
        this.codePush.sync({
            deploymentKey: deploymentKey
        }).subscribe((syncStatus) => {

            if (syncStatus === SyncStatus.UP_TO_DATE) {

                // facing some zoning problems here !!
                // why ??

                // forcing to run in the ngzone
                this.ngZone.run(() => {
                    this.messageText = '应用程式是最新的！';
                });
            }

            // not facing zoning issue here ?

            switch (syncStatus) {
                case SyncStatus.IN_PROGRESS:
                    this.messageText = '正在进行更新 ..';
                    break;

                case SyncStatus.CHECKING_FOR_UPDATE:
                    this.messageText = '检查更新 ..';
                    break;

                case SyncStatus.DOWNLOADING_PACKAGE:
                    this.messageText = '下载包 ..';
                    break;

                case SyncStatus.INSTALLING_UPDATE:
                    this.messageText = '安装更新 ..';
                    break;

                case SyncStatus.UPDATE_INSTALLED:
                    this.messageText = '安装更新 ..';
                    const alert = this.alertCtrl.create({
                        title: '更新',
                        message: '安装了一个新的更新，并将在下次重新启动应用程序时可用',
                        buttons: ['好']
                    });
                    alert.present();
                    alert.onDidDismiss(() => {
                    });
                    break;

                case SyncStatus.ERROR:
                    this.messageText = '发生错误 :( ...';
                    break;

                default:
                    this.messageText = '未处理的同步状态 ..';
                    break;
            }

        });
    }

    toastShowWithOptions(options: ToastOptions) {
        if (this.isMobile()) {
            this.toast.showWithOptions(options).subscribe(
                toast => {
                }
            );
        } else {
            let toast = this.toastCtrl.create({
                message: options.message,
                duration: options.duration,
                position: options.position
            });

            toast.present();
        }

    }

    /**
     * Storage
     */

    setStorage(key: any, value: any) {
        this.storage.set(key, value);
    }

    getStorage(key: any): Promise<any> {
        return new Promise((resolve) => {
            this.storage.get(key).then((value) => {
                resolve(value);
            }).catch(err => {
                this.warn('getStorage:' + err);
            });
        });
    }

    removeStorage(key: any) {
        this.storage.remove(key);
    }
}
