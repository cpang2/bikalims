from AccessControl import ClassSecurityInfo
from Products.Archetypes.public import *
from zope.interface import implements

from bika.lims.content.bikaschema import BikaSchema

from bika.lims.config import PROJECTNAME
from bika.lims.interfaces import IStorageType
from bika.lims import bikaMessageFactory as _

Temperature = StringField(
    'Temperature',
    widget=StringWidget(
        label=_('Temperature'),
        description=_('The associated temperature to storage with this type.'),
    )
)

schema = BikaSchema.copy() + Schema((
    Temperature
))

schema['description'].widget.visible = True
schema['description'].schemata = 'default'


class StorageType(BaseContent):
    implements(IStorageType)
    security = ClassSecurityInfo()
    displayContentsTab = False
    schema = schema

    _at_rename_after_creation = True

    def _renameAfterCreation(self, check_auto_id=False):
        from bika.lims.idserver import renameAfterCreation
        renameAfterCreation(self)

registerType(StorageType, PROJECTNAME)
