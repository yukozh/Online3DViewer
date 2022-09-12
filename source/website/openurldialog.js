import { ReadLines } from '../engine/import/importerutils.js';
import { AddDiv, CreateDomElement } from '../engine/viewer/domutils.js';
import { ButtonDialog } from './dialog.js';

export function ShowOpenUrlDialog (onOk)
{
    let dialog = new ButtonDialog ();
    let urlsTextArea = CreateDomElement ('textarea', 'ov_dialog_textarea');
    let contentDiv = dialog.Init ('打开网络上的模型', [
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Close ();
            }
        },
        {
            name : 'OK',
            onClick () {
                let urls = [];
                ReadLines (urlsTextArea.value, (line) => {
                    urls.push (line);
                });
                dialog.Close ();
                onOk (urls);
            }
        }
    ]);
    let text = '请在下面编辑框中粘贴模型文件的URL，如果要打开多个模型，可以使用回车来分割不同的模型URL';
    AddDiv (contentDiv, 'ov_dialog_section', text);
    contentDiv.appendChild (urlsTextArea);
    dialog.Open ();
    urlsTextArea.focus ();
    return dialog;
}
