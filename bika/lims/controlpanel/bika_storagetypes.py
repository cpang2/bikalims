from Products.ATContentTypes.content import schemata
from Products.Archetypes import atapi
from bika.lims import bikaMessageFactory as _
from bika.lims.browser.bika_listing import BikaListingView
from bika.lims.config import PROJECTNAME
from bika.lims.interfaces import IStorageTypes
from plone.app.content.browser.interfaces import IFolderContentsView
from plone.app.layout.globals.interfaces import IViewView
from plone.app.folder.folder import ATFolderSchema, ATFolder
from zope.interface.declarations import implements


class StorageTypesView(BikaListingView):
    implements(IFolderContentsView, IViewView)

    def __init__(self, context, request):
        super(StorageTypesView, self).__init__(context, request)
        self.catalog = 'bika_setup_catalog'
        self.contentFilter = {'portal_type': 'StorageType',
                              'sort_on': 'sortable_title'}
        self.context_actions = {_('Add'):
                                {'url': 'createObject?type_name=StorageType',
                                 'icon': '++resource++bika.lims.images/add.png'}}
        self.icon = self.portal_url + "/++resource++bika.lims.images/to_follow_big.png"
        self.title = self.context.translate(_("Storage Types"))
        self.description = ""
        self.show_sort_column = False
        self.show_select_row = False
        self.show_select_column = True
        self.pagesize = 25

        self.columns = {
            'Title': {'title': _('Type'),
                      'index': 'sortable_title'},
            'Description': {'title': _('Description'),
                            'index': 'description',
                            'toggle':True},
        }

        self.review_states = [
            {
                'id':'default',
                'title': _('Active'),
                'contentFilter': {'inactive_state': 'active'},
                'transitions': [{'id':'deactivate'}, ],
                'columns': ['Title', 'Description']
            },
            {
                'id':'inactive',
                'title': _('Dormant'),
                'contentFilter': {'inactive_state': 'inactive'},
                'transitions': [{'id':'activate'}, ],
                'columns': ['Title', 'Description']
            },
            {
                'id':'all',
                'title': _('All'),
                'contentFilter':{},
                'columns': ['Title', 'Description']
            },
        ]

    def folderitems(self):
        items = BikaListingView.folderitems(self)
        for x in range(len(items)):
            if not items[x].has_key('obj'):
                continue
            obj = items[x]['obj']
            items[x]['Description'] = obj.Description()
            items[x]['replace']['Title'] = "<a href='%s'>%s</a>" % \
               (items[x]['url'], items[x]['Title'])

        return items

schema = ATFolderSchema.copy()
class StorageTypes(ATFolder):
    implements(IStorageTypes)
    displayContentsTab = False
    schema = schema

schemata.finalizeATCTSchema(schema, folderish=True, moveDiscussion=False)
atapi.registerType(StorageTypes, PROJECTNAME)
