import joplin from 'api';
const nodemailer = require("nodemailer");
const translations = require("./res/lang/translation.json");
import { currentGlobal } from './index';
import { convertToHTML } from './style_extension';

// 将html中的src地址设置为nodemailer支持发松的格式
function htmlOfImageUrl(html) {
    const regExp = /<img[^>]+src=['"]([^'"]+)['"]+/g;
    let temp;
    while ((temp = regExp.exec(html)) != null) {
        if (temp[1].startsWith(":/")) {
            let srcId = temp[1].replace(/:\//, "cid:");
            html = html.replace(temp[1], srcId);
        }
    }
    return html;

    // var liveHtml = $('<div></div>').html(html);
    // var return_html = $('img', liveHtml).each(function () {
    //     var img_url = $(this).attr('src').replace(/:\//, "cid:");
    // });
    // console.log(return_html)
    // return liveHtml;
}

// 获取html中的src地址，存为数组
async function htmlOfImage(html) {
    const regExp = /<img[^>]+src=['"]([^'"]+)['"]+/g;
    const result = [];
    let temp;
    while ((temp = regExp.exec(html)) != null) {
        if (temp[1].startsWith(":/")) {
            let srcId = temp[1].replace(/:\//, "");
            let title;
            await joplin.data.get(['resources', srcId], {
                fields: "id, title, updated_time",
                order_by: "updated_time",
                order_dir: "DESC"
            }).then(function (obj) {
                title = obj.title;
            });
            await joplin.data.resourcePath(srcId).then(function (scr_url) {
                result.push({ 'filename': title, 'path': scr_url, 'cid': srcId });
            });
        }
    }
    return result;
}

//通过nodeMailer发送消息
async function nodeMailerSend(host, port, secure, user, pass, from, to, subject, html, imgSrc) {
    imgSrc.then(function (attachments) {
        var transporter = nodemailer.createTransport({
            host: host,
            secureConnection: true,
            port: port,
            secure: secure,
            auth: {
                user: user,
                pass: pass
            },
            priority: "high"
        });


        var mailOptins = {
            from: from,
            to: to,
            subject: subject,
            html: html,
            attachments
        };
        console.log(mailOptins);
        function translate(key) {
            return translations[currentGlobal][key] ?? key;
        }
        transporter.sendMail(mailOptins, (error, info) => {
            if (error) {
                joplin.views.dialogs.showMessageBox(translate('sendMailFailed') + error);
            } else {
                joplin.views.dialogs.showMessageBox(translate('mailSentSuccessfully') + info.response);
            }
        });
    });

}

// 发送邮件
export async function sendEmail(title, content) {
    const host = await joplin.settings.value("host");
    const port = await joplin.settings.value("port");
    const secure = await joplin.settings.value("secure");
    const user = await joplin.settings.value("user");
    const pass = await joplin.settings.value("pass");
    const to = await joplin.settings.value("to");

    convertToHTML(content).then(function (htmlText) {
        // 获取图像地址
        const attachments = htmlOfImage(htmlText);
        // 适合nodeMailer的图像地址
        const html = htmlOfImageUrl(htmlText);
        // 发送消息
        nodeMailerSend(host, port, secure, user, pass, user, to, title, html, attachments);
    });
}
