const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const ml5 = require('../ml5.min.js');
const formatMessage = require('format-message');

const HAT_TIMEOUT = 100;

const Message = {
  when_received_block: {
    'ja': '認識結果を受け取ったとき',
    'ja-Hira': 'にんしきけっかをうけとったとき',
    'en': 'when received classification results',
    'zh-cn': '收到分类结果时'
  },
  result1: {
    'ja': '認識結果1',
    'ja-Hira': 'にんしきけっか1',
    'en': 'result1',
    'zh-cn': '结果1'
  },
  result2: {
    'ja': '認識結果2',
    'ja-Hira': 'にんしきけっか2',
    'en': 'result2',
    'zh-cn': '结果2'
  },
  result3: {
    'ja': '認識結果3',
    'ja-Hira': 'にんしきけっか3',
    'en': 'result3',
    'zh-cn': '结果3'
  },
  confidence1: {
    'ja': '精度1',
    'ja-Hira': 'せいど1',
    'en': 'confidence1',
    'zh-cn': '置信度1'
  },
  confidence2: {
    'ja': '精度2',
    'ja-Hira': 'せいど2',
    'en': 'confidence2',
    'zh-cn': '置信度2'
  },
  confidence3: {
    'ja': '精度3',
    'ja-Hira': 'せいど3',
    'en': 'confidence3',
    'zh-cn': '置信度3'
  },
  toggle_classification: {
    'ja': '画像認識を[CLASSIFICATION_STATE]にする',
    'ja-Hira': 'がぞうにんしきを[CLASSIFICATION_STATE]にする',
    'en': 'turn classification [CLASSIFICATION_STATE]',
    'zh-cn': '[CLASSIFICATION_STATE]分类'
  },
  set_classification_interval: {
    'ja': '画像認識を[CLASSIFICATION_INTERVAL]秒間に1回行う',
    'ja-Hira': 'がぞうにんしきを[CLASSIFICATION_INTERVAL]びょうかんに1かいおこなう',
    'en': 'Classify once every [CLASSIFICATION_INTERVAL] seconds',
    'zh-cn': '每隔[CLASSIFICATION_INTERVAL]秒标记一次'
  },
  video_toggle: {
    'ja': 'ビデオを[VIDEO_STATE]にする',
    'ja-Hira': 'ビデオを[VIDEO_STATE]にする',
    'en': 'turn video [VIDEO_STATE]',
    'zh-cn': '[VIDEO_STATE]摄像头'
  },
  on: {
    'ja': '入',
    'ja-Hira': 'いり',
    'en': 'on',
    'zh-cn': '开启'
  },
  off: {
    'ja': '切',
    'ja-Hira': 'きり',
    'en': 'off',
    'zh-cn': '关闭'
  },
  video_on_flipped: {
    'ja': '左右反転',
    'ja-Hira': 'さゆうはんてん',
    'en': 'on flipped',
    'zh-cn': '镜像开启'
  }
}

const AvailableLocales = ['en', 'ja', 'ja-Hira', 'zh-cn'];

class Scratch3ImageClassifierBlocks {
  constructor (runtime) {
    this.runtime = runtime;
    this.when_received = false;
    this.results = [];
    this.locale = this.setLocale();

    this.video = document.createElement("video");
    this.video.width = 480;
    this.video.height = 360;
    this.video.autoplay = true;
    this.video.style.display = "none";

    this.blockClickedAt = null;

    this.interval = 1000;

    let media = navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    media.then((stream) => {
      this.video.srcObject = stream;
    });

    this.classifier = ml5.imageClassifier('MobileNet', () => {
      console.log('Model Loaded!');
      this.timer = setInterval(() => {
        this.classify();
      }, this.interval);
    });

    this.runtime.ioDevices.video.enableVideo();
  }

  getInfo() {
    this.locale = this.setLocale();

    return {
      id: 'ic2scratch',
      name: 'ImageClassifier2Scratch',
      blocks: [
        {
          opcode: 'getResult1',
          text: Message.result1[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getResult2',
          text: Message.result2[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getResult3',
          text: Message.result3[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getConfidence1',
          text: Message.confidence1[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getConfidence2',
          text: Message.confidence2[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getConfidence3',
          text: Message.confidence3[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'whenReceived',
          text: Message.when_received_block[this.locale],
          blockType: BlockType.HAT,
        },
        {
          opcode: 'toggleClassification',
          text: Message.toggle_classification[this.locale],
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFICATION_STATE: {
              type: ArgumentType.STRING,
              menu: 'classification_menu',
              defaultValue: 'off'
            }
          }
        },
        {
          opcode: 'setClassificationInterval',
          text: Message.set_classification_interval[this.locale],
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFICATION_INTERVAL: {
              type: ArgumentType.STRING,
              menu: 'classification_interval_menu',
              defaultValue: '1'
            }
          }
        },
        {
          opcode: 'videoToggle',
          text: Message.video_toggle[this.locale],
          blockType: BlockType.COMMAND,
          arguments: {
            VIDEO_STATE: {
              type: ArgumentType.STRING,
              menu: 'video_menu',
              defaultValue: 'off'
            }
          }
        }
      ],
      menus: {
        video_menu: this.getVideoMenu(),
        classification_interval_menu: this.getClassificationIntervalMenu(),
        classification_menu: this.getClassificationMenu()
      }
    };
  }

  getResult1() {
    return this.results[0]['label'];
  }

  getResult2() {
    return this.results[1]['label'];
  }

  getResult3() {
    return this.results[2]['label'];
  }

  getConfidence1() {
    return this.results[0]['confidence'];
  }

  getConfidence2() {
    return this.results[1]['confidence'];
  }

  getConfidence3() {
    return this.results[2]['confidence'];
  }

  whenReceived(args) {
    if (this.when_received) {
      setTimeout(() => {
          this.when_received = false;
      }, HAT_TIMEOUT);
      return true;
    }
    return false;
  }

  toggleClassification (args) {
    if (this.actionRepeated()) { return };

    let state = args.CLASSIFICATION_STATE;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (state === 'on') {
      this.timer = setInterval(() => {
        this.classify();
      }, this.interval);
    }
  }

  setClassificationInterval (args) {
    if (this.actionRepeated()) { return };

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.interval = args.CLASSIFICATION_INTERVAL * 1000;
    this.timer = setInterval(() => {
      this.classify();
    }, this.interval);
  }

  videoToggle (args) {
    if (this.actionRepeated()) { return };

    let state = args.VIDEO_STATE;
    if (state === 'off') {
      this.runtime.ioDevices.video.disableVideo();
    } else {
      this.runtime.ioDevices.video.enableVideo();
      this.runtime.ioDevices.video.mirror = state === "on";
    }
  }

  classify() {
    this.classifier.classify(this.video, (err, results) => {
      if (err) {
        console.error(err);
      } else {
        this.when_received = true;
        this.results = results;
      }
    });
  }

  actionRepeated() {
    let currentTime = Date.now();
    if (this.blockClickedAt && (this.blockClickedAt + 250) > currentTime) {
      console.log('Please do not repeat trigerring this block.');
      this.blockClickedAt = currentTime;
      return true;
    } else {
      this.blockClickedAt = currentTime;
      return false;
    }
  }

  getVideoMenu() {
    return [
      {
        text: Message.off[this.locale],
        value: 'off'
      },
      {
        text: Message.on[this.locale],
        value: 'on'
      },
      {
        text: Message.video_on_flipped[this.locale],
        value: 'on-flipped'
      }
    ]
  }

  getClassificationIntervalMenu() {
    return [
      {
        text: '5',
        value: '5'
      },
      {
        text: '2',
        value: '2'
      },
      {
        text: '1',
        value: '1'
      },
      {
        text: '0.5',
        value: '0.5'
      }
    ]
  }

  getClassificationMenu() {
    return [
      {
        text: Message.off[this.locale],
        value: 'off'
      },
      {
        text: Message.on[this.locale],
        value: 'on'
      }
    ]
  }

  setLocale() {
    let locale = formatMessage.setup().locale;
    if (AvailableLocales.includes(locale)) {
      return locale;
    } else {
      return 'en';
    }
  }
}

module.exports = Scratch3ImageClassifierBlocks;
