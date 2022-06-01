import 'shared/autocomplete/index.js';
import BootstrapModal from "plugins/modal/base.js";
import compact from 'lodash-es/compact';
import tpl_add_contact_modal from "./templates/add-contact.js";
import { __ } from 'i18n';
import { _converse, api, converse } from "@converse/headless/core";

const { Strophe } = converse.env;
const u = converse.env.utils;


const AddContactModal = BootstrapModal.extend({
    id: "add-contact-modal",

    initialize () {
        BootstrapModal.prototype.initialize.apply(this, arguments);
        this.listenTo(this.model, 'change', this.render);
    },

    toHTML () {
        return tpl_add_contact_modal(this);
    },

    getGroupsAutoCompleteList () {
        return [...new Set(_converse.roster.map(i => i.get('group')).filter(i => i))];
    },

    validateSubmission (jid) {
        const el = this.el.querySelector('.invalid-feedback');
        if (!jid || compact(jid.split('@')).length < 2) {
            u.addClass('is-invalid', this.el.querySelector('input[name="jid"]'));
            u.addClass('d-block', el);
            return false;
        } else if (_converse.roster.get(Strophe.getBareJidFromJid(jid))) {
            el.textContent = __('This contact has already been added')
            u.addClass('d-block', el);
            return false;
        }
        u.removeClass('d-block', el);
        return true;
    },

    afterSubmission (form, jid, name, group) {
        if (group && !Array.isArray(group)) {
            group = [group];
        }
        _converse.roster.addAndSubscribe(jid, name, group);
        this.model.clear();
        this.modal.hide();
    },

    addContactFromForm (ev) {
        ev.preventDefault();
        const data = new FormData(ev.target);
        const jid = (data.get('jid') || '').trim();

        if (!jid && typeof api.settings.get('xhr_user_search_url') === 'string') {
            const input_el = this.el.querySelector('input[name="name"]');
            this.xhr.open("GET", `${api.settings.get('xhr_user_search_url')}q=${encodeURIComponent(input_el.value)}`, true);
            this.xhr.send()
            return;
        }
        if (this.validateSubmission(jid)) {
            this.afterSubmission(ev.target, jid, data.get('name'), data.get('group'));
        }
    }
});

_converse.AddContactModal = AddContactModal;

export default AddContactModal;
