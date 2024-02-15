import joplin from 'api';
import { MenuItemLocation, SettingItemType, ToolbarButtonLocation } from 'api/types';
import { sendEmail } from './sendEmail';
const translations = require("./res/lang/translation.json");

export let currentGlobal;

joplin.plugins.register({
    onStart: async function () {
        //获取joplin的语言
        async function getLocale() {
            return await joplin.settings.globalValue("locale");
        }
        
        currentGlobal = await getLocale();
        console.debug("joplin 现在的语言  ", currentGlobal)

        //如果joplin设置了新的语言，防止出错设置一个默认语言
        if (!currentGlobal) {
            currentGlobal = "zh_CN";
        }

        // 设置语言文本
        function translate(key) {
            return translations[currentGlobal][key] ?? key;
        }

        // 更改语言
        function changeLocale(locale) {
            currentGlobal = locale;
        }

        // 监测语言变化
        async function pollLocale() {
            const handlerOptions = { passive: true };
            console.debug("开始监测joplin语言变化");
            const interval = async () => {
                const newLocale = await getLocale();
                if (newLocale !== currentGlobal) {
                    currentGlobal = newLocale;
                    changeLocale(currentGlobal);
                    window.location.reload();
                }
                setTimeout(interval, 1000);
            };
            interval();
            window.addEventListener('scroll', interval, handlerOptions);
            console.debug("结束监测joplin语言变化");
        }

        // 在插件初始化时开始监听语言变化
        pollLocale();



        await joplin.settings.registerSettings({
            'host': {
                label: translate('host'),
                value: 'smtp.office365.com',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('host_description'),
            },
            'port': {
                label: translate('port'),
                value: 587,
                type: SettingItemType.Int,
                section: 'joplin-note-email',
                public: true,
                description: translate('port_description'),
            },
            'secure': {
                label: translate('secure'),
                value: false,
                type: SettingItemType.Bool,
                section: 'joplin-note-email',
                public: true,
                description: translate('secure_description'),
            },
            'user': {
                label: translate('user'),
                value: '',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('user_description'),
            },
            'pass': {
                label: translate('pass'),
                value: '',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                secure: true,
                description: translate('pass_description'),
            },
            'to': {
                label: translate('to'),
                value: '',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('to_description'),
            },
            'table_style': {
                label: translate('table_style'),
                value: 'width: 100%; border-spacing: 0px; border-collapse: collapse; border: none; margin-top: 20px;',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('table_style_description'),
                advanced: true
            },
            'th': {
                label: translate('th'),
                value: 'border: 1px solid #DBDBDB; color: #666666; font-size: 14px; font-weight: normal; text-align: left; padding-left: 14px;',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('th_description'),
                advanced: true
            },
            'tr_even': {
                label: translate('tr_even'),
                value: 'height: 40px; background: #F6F6F6;',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('tr_even_description'),
                advanced: true
            },
            'td': {
                label: translate('td'),
                value: 'border: 1px solid #DBDBDB; font-size: 14px; font-weight: normal; text-align: left; padding-left: 14px;',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('td_description'),
                advanced: true
            },
            'tr_odd': {
                label: translate('tr_odd'),
                value: 'height: 40px;',
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('tr_odd_description'),
                advanced: true
            },
            'blockquote': {
                label: translate('blockquote'),
                value: "color: #777; background-color: rgba(66, 185, 131, .1);  border-left: 4px solid #42b983;padding: 10px 15px;position: relative;font-family: 'Roboto', sans-serif;line-height: 150%;text-indent: 35px;",
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('blockquote_description'),
                advanced: true
            },
            'pre': {
                label: translate('pre'),
                value: "overflow-x:scroll;padding: 1rem;font-size: 85%;line-height: 1.45;background-color: #f7f7f7;border: 0;border-radius: 3px;color: #777777;margin-top: 0 !important;",
                type: SettingItemType.String,
                section: 'joplin-note-email',
                public: true,
                description: translate('pre_description'),
                advanced: true
            },
            'latex': {
                label: translate('latex'),
                value: "https://www.zhihu.com/equation?tex=",
                type: SettingItemType.String,
                options: {
                    "https://www.zhihu.com/equation?tex=": "https://www.zhihu.com/equation?tex=", "https://latex.codecogs.com/svg.image?": "https://latex.codecogs.com/svg.image?", "https://chart.googleapis.com/chart?cht=tx&chl=": "https://chart.googleapis.com/chart?cht=tx&chl="
                },
                section: 'joplin-note-email',
                description: translate('latex_description'),
                public: true,
                isEnum: true,
                advanced: true
            },
        });

        await joplin.settings.registerSection("joplin-note-email", {
            label: translate('noteEmail'),
            iconName: "far fa-envelope",
        });

        // 获取当前笔记
        async function getCurrentNote() {
            const note = await joplin.workspace.selectedNote();
            if (note) {
                return note;
            } else {
                console.info("没有选择笔记");
            }
        }
        await joplin.workspace.onNoteChange(() => {
            getCurrentNote();
        });
        await joplin.workspace.onNoteSelectionChange(() => {
            getCurrentNote();
        });
        getCurrentNote();

        // 命令行发送邮件
        await joplin.commands.register({
            name: "sendEmail",
            label: translate('sendEmail'),
            iconName: "fa fa-solid fa-envelope",
            execute: async () => {
                const currNote = await getCurrentNote();
                if (currNote) {
                    sendEmail(currNote.title, currNote.body);
                } else {
                    console.info("执行命令错误");
                }
            },
        });

        // 右键 发送选中文本
        await joplin.commands.register({
            name: "sendEmailSelection",
            label: translate('sendEmailSelection'),
            execute: async () => {
                const currNote = await getCurrentNote();
                // get selected text
                const selectedText = (await joplin.commands.execute(
                    "selectedText"
                )) as string;
                if (selectedText) {
                    sendEmail(currNote.title, selectedText);
                } else {
                    console.info("执行错误");
                }
            },
        });

        // 上下文菜单
        await joplin.views.menuItems.create(
            "emailSelectionThroughContextMenu",
            "sendEmailSelection",
            MenuItemLocation.EditorContextMenu,
            { accelerator: "Ctrl+Alt+E" }
        );

        // 工具栏按钮
        await joplin.views.toolbarButtons.create(
            "email-button",
            "sendEmail",
            ToolbarButtonLocation.EditorToolbar
        );
    },
});